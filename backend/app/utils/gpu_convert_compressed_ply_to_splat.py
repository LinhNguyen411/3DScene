# convert_compressed_ply_to_splat_gpu.py
import sys
import struct
import math
import numpy as np
import time
import torch
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any, BinaryIO

# --- Constants ---
VERSION = "0.4.0"  # Updated version for GPU conversion
SH_C0 = 0.28209479177387814  # Constant for SH DC color conversion
CHUNK_SIZE_COMPRESSION = 256  # Default chunk size used during compression

# --- Data Structures ---
@dataclass
class PlyProperty:
    name: str
    type: str

@dataclass
class PlyElement:
    name: str
    count: int
    properties: List[PlyProperty] = field(default_factory=list)
    data_offset: int = 0
    item_stride: int = 0

@dataclass
class PlyHeader:
    strings: List[str] = field(default_factory=list)
    elements: List[PlyElement] = field(default_factory=list)
    data_start_offset: int = 0

@dataclass
class PlyFile:
    header: PlyHeader
    data: bytes

# --- PLY Type Info ---
PLY_TYPE_MAP = {
    'char':   ('b', 1, np.int8), 'uchar':  ('B', 1, np.uint8),
    'short':  ('<h', 2, np.int16), 'ushort': ('<H', 2, np.uint16),
    'int':    ('<i', 4, np.int32), 'uint':   ('<I', 4, np.uint32),
    'float':  ('<f', 4, np.float32), 'double': ('<d', 8, np.float64)
}

def get_data_type_info(type_str: str) -> Optional[Tuple[str, int, Any]]:
    return PLY_TYPE_MAP.get(type_str)

# --- Utility Functions ---
def clamp(value, min_value=0, max_value=255):
    return max(min_value, min(value, max_value))

# --- GPU Utility Functions ---
def unpack_unorm_gpu(packed_val, bits):
    """GPU version of unpack_unorm using PyTorch operations"""
    max_val = (1 << bits) - 1
    clamped_val = torch.clamp(packed_val & max_val, 0, max_val)
    return clamped_val.float() / max_val

def unpack_11_10_11_gpu(packed_val):
    """GPU version of unpack_11_10_11 using PyTorch operations"""
    x = unpack_unorm_gpu((packed_val >> 21) & 0x7FF, 11)
    y = unpack_unorm_gpu((packed_val >> 11) & 0x3FF, 10)
    z = unpack_unorm_gpu(packed_val & 0x7FF, 11)
    return torch.stack([x, y, z], dim=1)

def unpack_8888_gpu(packed_val):
    """GPU version of unpack_8888 using PyTorch operations"""
    x = unpack_unorm_gpu((packed_val >> 24) & 0xFF, 8)
    y = unpack_unorm_gpu((packed_val >> 16) & 0xFF, 8)
    z = unpack_unorm_gpu((packed_val >> 8) & 0xFF, 8)
    w = unpack_unorm_gpu(packed_val & 0xFF, 8)
    return torch.stack([x, y, z, w], dim=1)

def unpack_rot_gpu(packed_val):
    """GPU version of unpack_rot using PyTorch operations"""
    largest_idx = (packed_val >> 30) & 0x3
    norm = 0.7071067811865475  # sqrt(2)/2
    
    # Extract 10-bit components
    packed_comps = packed_val & 0x3FFFFFFF
    comp_2 = unpack_unorm_gpu(packed_comps & 0x3FF, 10)
    comp_1 = unpack_unorm_gpu((packed_comps >> 10) & 0x3FF, 10)
    comp_0 = unpack_unorm_gpu((packed_comps >> 20) & 0x3FF, 10)
    
    # Convert to [-1, 1] range (centered at 0)
    comp_0 = (comp_0 - 0.5) / norm
    comp_1 = (comp_1 - 0.5) / norm
    comp_2 = (comp_2 - 0.5) / norm
    
    # Create quaternion array
    q = torch.zeros((packed_val.size(0), 4), device=packed_val.device)
    
    # Handle each possible largest index case
    for idx in range(4):
        mask = (largest_idx == idx)
        if not mask.any():
            continue
            
        # For each mask, distribute the three components to non-idx positions
        components = [comp_0[mask], comp_1[mask], comp_2[mask]]
        component_idx = 0
        
        for i in range(4):
            if i != idx:
                q[mask, i] = components[component_idx]
                component_idx += 1
                
        # Calculate sum of squares for each quaternion
        sum_sq = torch.sum(q[mask] ** 2, dim=1)
        
        # Handle case where sum_sq >= 1.0
        overflow_mask = (sum_sq >= 1.0)
        if overflow_mask.any():
            # Normalize the quaternion
            norm_factors = torch.sqrt(torch.clamp(sum_sq[overflow_mask], min=1e-12))
            for i in range(4):
                if i != idx:
                    q[mask][overflow_mask, i] = q[mask][overflow_mask, i] / norm_factors.unsqueeze(1)
        
        # Handle case where sum_sq < 1.0
        valid_mask = (sum_sq < 1.0)
        if valid_mask.any():
            q[mask][valid_mask, idx] = torch.sqrt(1.0 - sum_sq[valid_mask])
            
    return q

def denormalize_gpu(norm_val, min_v, max_v):
    """GPU version of denormalize using PyTorch operations"""
    # Handle case where min == max
    mask = (max_v == min_v)
    result = torch.empty_like(norm_val)
    result[mask] = min_v[mask]
    
    # For normal case
    norm_mask = ~mask
    result[norm_mask] = norm_val[norm_mask] * (max_v[norm_mask] - min_v[norm_mask]) + min_v[norm_mask]
    return result

# --- PLY Reading Logic ---
def parse_ply_header(header_bytes: bytes) -> PlyHeader:
    header_str = header_bytes.decode('ascii')
    lines = [line for line in header_str.split('\n') if line.strip()]
    if not lines or lines[0] != 'ply': raise ValueError("Invalid PLY header: Missing 'ply' magic word.")
    header = PlyHeader(strings=lines)
    current_element: Optional[PlyElement] = None
    current_data_offset = 0
    i = 1
    while i < len(lines):
        parts = lines[i].split()
        command = parts[0]
        if command == 'format':
            if len(parts) < 3 or parts[1] != 'binary_little_endian' or parts[2] != '1.0': raise ValueError(f"Unsupported PLY format: {' '.join(parts[1:])}.")
            i += 1
        elif command == 'comment': i += 1
        elif command == 'element':
            if len(parts) != 3: raise ValueError(f"Invalid element definition: {lines[i]}")
            element_name, element_count_str = parts[1], parts[2]
            try: element_count = int(element_count_str)
            except ValueError: raise ValueError(f"Invalid element count: {element_count_str}")
            if current_element: current_data_offset += current_element.item_stride * current_element.count
            current_element = PlyElement(name=element_name, count=element_count, data_offset=current_data_offset)
            header.elements.append(current_element)
            i += 1
        elif command == 'property':
            if current_element is None or len(parts) != 3: raise ValueError(f"Invalid property definition: {lines[i]}")
            prop_type, prop_name = parts[1], parts[2]
            type_info = get_data_type_info(prop_type)
            if not type_info: raise ValueError(f"Invalid property type '{prop_type}' in line: {lines[i]}")
            current_element.properties.append(PlyProperty(name=prop_name, type=prop_type))
            current_element.item_stride += type_info[1]
            i += 1
        elif command == 'end_header':
            if current_element: current_data_offset += current_element.item_stride * current_element.count
            break
        else: raise ValueError(f"Unrecognized header command '{command}' in line: {lines[i]}")
    if i == len(lines): raise ValueError("Invalid PLY header: Missing 'end_header'.")
    return header

def read_compressed_ply(filename: str) -> PlyFile:
    magic_bytes = b'ply\n'; end_header_bytes = b'end_header\n'; max_header_size = 128 * 1024
    with open(filename, 'rb') as f:
        header_chunk = f.read(len(magic_bytes))
        if header_chunk != magic_bytes: raise ValueError("Invalid PLY file: Incorrect magic bytes.")
        header_rest = b''
        while end_header_bytes not in header_rest:
            char = f.read(1)
            if not char: raise ValueError("Invalid PLY header: Reached EOF before 'end_header'.")
            header_rest += char
            if len(header_rest) + len(magic_bytes) > max_header_size: raise ValueError(f"PLY header exceeds maximum size of {max_header_size} bytes.")
        full_header_bytes = magic_bytes + header_rest
        end_header_index = full_header_bytes.find(end_header_bytes)
        parseable_header_bytes = full_header_bytes[:end_header_index + len(end_header_bytes)]
        header_size_in_file = len(full_header_bytes)
        header = parse_ply_header(parseable_header_bytes)
        header.data_start_offset = header_size_in_file
        f.seek(header_size_in_file)
        data = f.read()
        return PlyFile(header=header, data=data)

# --- GPU Implementation ---
def calculate_importance_gpu(packed_vertex_data, chunk_headers, num_chunks):
    """Calculate importance for all vertices using GPU"""
    print("Calculating importance on GPU...")
    start_time = time.time()
    
    # Move data to GPU
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cpu":
        print("WARNING: CUDA not available, falling back to CPU")
    
    # Convert to torch tensors
    packed_vertex_data_gpu = torch.from_numpy(packed_vertex_data).to(device)
    chunk_headers_gpu = torch.from_numpy(chunk_headers).to(device)
    
    # Extract needed data
    num_splats = packed_vertex_data_gpu.size(0)
    packed_pos = packed_vertex_data_gpu[:, 0]
    packed_scale = packed_vertex_data_gpu[:, 2]
    packed_color = packed_vertex_data_gpu[:, 3]
    
    # Calculate chunk indices for each vertex
    chunk_indices = torch.div(torch.arange(num_splats, device=device), 
                             CHUNK_SIZE_COMPRESSION, rounding_mode='floor')
    valid_mask = chunk_indices < num_chunks
    
    # Get min/max values for each chunk
    chunk_sx_min = chunk_headers_gpu[chunk_indices[valid_mask], 6]
    chunk_sy_min = chunk_headers_gpu[chunk_indices[valid_mask], 7]
    chunk_sz_min = chunk_headers_gpu[chunk_indices[valid_mask], 8]
    chunk_sx_max = chunk_headers_gpu[chunk_indices[valid_mask], 9]
    chunk_sy_max = chunk_headers_gpu[chunk_indices[valid_mask], 10]
    chunk_sz_max = chunk_headers_gpu[chunk_indices[valid_mask], 11]
    
    # Unpack scale values
    unpacked_scales = unpack_11_10_11_gpu(packed_scale[valid_mask])
    norm_sx, norm_sy, norm_sz = unpacked_scales[:, 0], unpacked_scales[:, 1], unpacked_scales[:, 2]
    
    # Denormalize
    scale_0 = denormalize_gpu(norm_sx, chunk_sx_min, chunk_sx_max)
    scale_1 = denormalize_gpu(norm_sy, chunk_sy_min, chunk_sy_max)
    scale_2 = denormalize_gpu(norm_sz, chunk_sz_min, chunk_sz_max)
    
    # Calculate size (exp of scales)
    # Handle potential overflow with large scales
    scale_0_safe = torch.clamp(scale_0, max=20.0)  # Limit to avoid exp overflow
    scale_1_safe = torch.clamp(scale_1, max=20.0)
    scale_2_safe = torch.clamp(scale_2, max=20.0)
    size = torch.exp(scale_0_safe) * torch.exp(scale_1_safe) * torch.exp(scale_2_safe)
    
    # Extract opacity from color
    norm_a = (packed_color[valid_mask] & 0xFF).float() / 255.0
    
    # Calculate importance
    importance = torch.zeros(num_splats, device=device)
    importance[valid_mask] = size * norm_a
    
    # Move back to CPU
    importance_cpu = importance.cpu().numpy()
    
    print(f"Importance calculation took: {time.time() - start_time:.2f} seconds")
    return importance_cpu

def process_splats_gpu(packed_vertex_data, chunk_headers, size_index, num_chunks, row_length):
    """Process all splats on GPU to build the SPLAT buffer"""
    print("Building SPLAT buffer on GPU...")
    start_time = time.time()
    
    num_splats = len(size_index)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Move data to GPU
    packed_vertex_data_gpu = torch.from_numpy(packed_vertex_data).to(device)
    chunk_headers_gpu = torch.from_numpy(chunk_headers).to(device)
    size_index_gpu = torch.from_numpy(size_index).to(device)
    
    # Create output tensors
    # Each row in output will have: position (3 floats), scale (3 floats), rgba (4 bytes), rotation (4 bytes)
    positions = torch.zeros((num_splats, 3), dtype=torch.float32, device=device)
    scales = torch.zeros((num_splats, 3), dtype=torch.float32, device=device)
    colors = torch.zeros((num_splats, 4), dtype=torch.uint8, device=device)
    rotations = torch.zeros((num_splats, 4), dtype=torch.uint8, device=device)
    
    # For each vertex in sorted order
    original_indices = size_index_gpu
    
    # Calculate chunk indices
    chunk_indices = torch.div(original_indices, CHUNK_SIZE_COMPRESSION, rounding_mode='floor')
    valid_mask = chunk_indices < num_chunks
    
    # Extract data for valid vertices
    packed_pos = packed_vertex_data_gpu[original_indices[valid_mask], 0]
    packed_rot = packed_vertex_data_gpu[original_indices[valid_mask], 1]
    packed_scale = packed_vertex_data_gpu[original_indices[valid_mask], 2]
    packed_color = packed_vertex_data_gpu[original_indices[valid_mask], 3]
    
    # Get chunk parameters for each vertex
    ch = chunk_headers_gpu[chunk_indices[valid_mask]]
    px_min, py_min, pz_min = ch[:, 0], ch[:, 1], ch[:, 2]
    px_max, py_max, pz_max = ch[:, 3], ch[:, 4], ch[:, 5]
    sx_min, sy_min, sz_min = ch[:, 6], ch[:, 7], ch[:, 8]
    sx_max, sy_max, sz_max = ch[:, 9], ch[:, 10], ch[:, 11]
    cr_min, cg_min, cb_min = ch[:, 12], ch[:, 13], ch[:, 14]
    cr_max, cg_max, cb_max = ch[:, 15], ch[:, 16], ch[:, 17]
    
    # --- Position ---
    pos_unpacked = unpack_11_10_11_gpu(packed_pos)
    pos_x = denormalize_gpu(pos_unpacked[:, 0], px_min, px_max)
    pos_y = denormalize_gpu(pos_unpacked[:, 1], py_min, py_max)
    pos_z = denormalize_gpu(pos_unpacked[:, 2], pz_min, pz_max)
    
    positions[valid_mask, 0] = pos_x
    positions[valid_mask, 1] = pos_y
    positions[valid_mask, 2] = pos_z
    
    # --- Scale ---
    scale_unpacked = unpack_11_10_11_gpu(packed_scale)
    scale_0 = denormalize_gpu(scale_unpacked[:, 0], sx_min, sx_max)
    scale_1 = denormalize_gpu(scale_unpacked[:, 1], sy_min, sy_max)
    scale_2 = denormalize_gpu(scale_unpacked[:, 2], sz_min, sz_max)
    
    # Calculate exp(scale) with overflow protection
    scale_0_safe = torch.clamp(scale_0, max=20.0)
    scale_1_safe = torch.clamp(scale_1, max=20.0)
    scale_2_safe = torch.clamp(scale_2, max=20.0)
    
    final_scale_0 = torch.exp(scale_0_safe)
    final_scale_1 = torch.exp(scale_1_safe)
    final_scale_2 = torch.exp(scale_2_safe)
    
    scales[valid_mask, 0] = final_scale_0
    scales[valid_mask, 1] = final_scale_1
    scales[valid_mask, 2] = final_scale_2
    
    # --- Color ---
    color_unpacked = unpack_8888_gpu(packed_color)
    denorm_r = denormalize_gpu(color_unpacked[:, 0], cr_min, cr_max)
    denorm_g = denormalize_gpu(color_unpacked[:, 1], cg_min, cg_max)
    denorm_b = denormalize_gpu(color_unpacked[:, 2], cb_min, cb_max)
    norm_a = color_unpacked[:, 3]
    
    # Convert to bytes (0-255)
    r_byte = torch.clamp((denorm_r * 255.99).to(torch.int32), 0, 255).to(torch.uint8)
    g_byte = torch.clamp((denorm_g * 255.99).to(torch.int32), 0, 255).to(torch.uint8)
    b_byte = torch.clamp((denorm_b * 255.99).to(torch.int32), 0, 255).to(torch.uint8)
    a_byte = torch.clamp((norm_a * 255.99).to(torch.int32), 0, 255).to(torch.uint8)
    
    colors[valid_mask, 0] = r_byte
    colors[valid_mask, 1] = g_byte
    colors[valid_mask, 2] = b_byte
    colors[valid_mask, 3] = a_byte
    
    # --- Rotation ---
    rot_unpacked = unpack_rot_gpu(packed_rot)
    
    # Normalize quaternions
    qlen_sq = torch.sum(rot_unpacked**2, dim=1)
    zero_mask = qlen_sq < 1e-12
    
    # Handle zero quaternions
    if zero_mask.any():
        rot_unpacked[zero_mask] = torch.tensor([0.0, 0.0, 0.0, 1.0], device=device)
        qlen_sq[zero_mask] = 1.0
    
    # Normalize non-zero quaternions
    non_zero_mask = ~zero_mask
    if non_zero_mask.any():
        qlen = torch.sqrt(qlen_sq[non_zero_mask]).unsqueeze(1)
        rot_unpacked[non_zero_mask] = rot_unpacked[non_zero_mask] / qlen
    
    # Convert to bytes (map [-1,1] to [0,255])
    rot_bytes = torch.clamp(((rot_unpacked * 127.5) + 127.5).to(torch.int32), 0, 255).to(torch.uint8)
    rotations[valid_mask] = rot_bytes
    
    # Move back to CPU and create buffer
    positions_cpu = positions.cpu().numpy()
    scales_cpu = scales.cpu().numpy()
    colors_cpu = colors.cpu().numpy()
    rotations_cpu = rotations.cpu().numpy()
    
    # Create the output buffer
    buffer = bytearray(row_length * num_splats)
    
    for j in range(num_splats):
        pos_offset = j * row_length
        scl_offset = pos_offset + 12
        rgb_offset = scl_offset + 12
        rot_offset = rgb_offset + 4
        
        # Pack position
        struct.pack_into('<3f', buffer, pos_offset, 
                         positions_cpu[j, 0], positions_cpu[j, 1], positions_cpu[j, 2])
        
        # Pack scale
        struct.pack_into('<3f', buffer, scl_offset, 
                         scales_cpu[j, 0], scales_cpu[j, 1], scales_cpu[j, 2])
        
        # Pack colors
        struct.pack_into('<4B', buffer, rgb_offset, 
                         colors_cpu[j, 0], colors_cpu[j, 1], colors_cpu[j, 2], colors_cpu[j, 3])
        
        # Pack rotation
        struct.pack_into('<4B', buffer, rot_offset, 
                         rotations_cpu[j, 0], rotations_cpu[j, 1], rotations_cpu[j, 2], rotations_cpu[j, 3])
    
    print(f"SPLAT buffer build took: {time.time() - start_time:.2f} seconds")
    return buffer

# --- Direct Compressed PLY to SPLAT Conversion Logic (GPU) ---
def convert_compressed_to_splat_gpu(ply_file: PlyFile) -> bytes:
    """
    Directly converts data using GPU acceleration.
    """
    print("Starting GPU-accelerated conversion...")
    start_time_direct = time.time()

    # Check for CUDA availability
    if torch.cuda.is_available():
        print(f"GPU acceleration enabled: {torch.cuda.get_device_name(0)}")
    else:
        print("Warning: CUDA is not available. Falling back to CPU computation.")

    # --- Find Compressed Elements ---
    chunk_element = next((e for e in ply_file.header.elements if e.name == 'chunk'), None)
    vertex_element = next((e for e in ply_file.header.elements if e.name == 'vertex'), None)
    if not chunk_element or not vertex_element:
        raise ValueError("Compressed PLY file missing 'chunk' or 'vertex' element.")

    num_splats = vertex_element.count
    num_chunks = chunk_element.count
    print(f"Found {num_splats} splats in {num_chunks} chunks.")

    # --- Access Compressed Data Blocks ---
    data = ply_file.data
    chunk_props_count = len(chunk_element.properties)
    chunk_headers = np.frombuffer(data, dtype=np.float32, count=num_chunks * chunk_props_count, offset=chunk_element.data_offset)
    chunk_headers = chunk_headers.reshape((num_chunks, chunk_props_count))

    vertex_props_count = len(vertex_element.properties)
    packed_vertex_data = np.frombuffer(data, dtype=np.uint32, count=num_splats * vertex_props_count, offset=vertex_element.data_offset)
    packed_vertex_data = packed_vertex_data.reshape((num_splats, vertex_props_count))

    # --- GPU Importance Calculation ---
    importance = calculate_importance_gpu(packed_vertex_data, chunk_headers, num_chunks)

    # --- Sort vertices by importance (descending) ---
    print("Sorting vertices by importance...")
    start_time_sort = time.time()
    size_index = np.argsort(importance)[::-1].astype(np.uint32)
    print(f"Sorting took: {time.time() - start_time_sort:.2f} seconds")
    del importance  # Free memory

    # --- GPU SPLAT Buffer Building ---
    row_length = 3 * 4 + 3 * 4 + 4 + 4  # 3 floats for pos, 3 floats for scale, 4 bytes for color, 4 bytes for rotation
    splat_buffer = process_splats_gpu(packed_vertex_data, chunk_headers, size_index, num_chunks, row_length)

    print(f"Total GPU conversion time: {time.time() - start_time_direct:.2f} seconds")
    return splat_buffer

def convert_ply_file_to_splat_buffer_gpu(file_path: str) -> bytes:
    """
    Converts a compressed PLY file to SPLAT format using GPU acceleration and returns the SPLAT data as bytes.

    Args:
        file_path (str): Path to the input .compressed.ply file (e.g., splat.model_url).

    Returns:
        bytes: The SPLAT data as a byte buffer.

    Raises:
        FileNotFoundError: If the input file does not exist.
        ValueError: If the PLY file is invalid or missing required elements.
        MemoryError: If the buffer allocation fails due to insufficient memory.
    """
    compressed_ply = read_compressed_ply(file_path)
    splat_data = convert_compressed_to_splat_gpu(compressed_ply)
    return splat_data

# --- Main Execution Logic ---
def main():
    print(f"GPU-Accelerated Compressed PLY to SPLAT Converter v{VERSION}")

    if len(sys.argv) < 3:
        print("Usage: python convert_compressed_ply_to_splat_gpu.py <input.compressed.ply> <output.splat>", file=sys.stderr)
        sys.exit(1)

    input_filename = sys.argv[1]
    output_filename = sys.argv[2]

    try:
        # 1. Read Compressed PLY File
        print(f"Loading compressed file '{input_filename}'...")
        start_time_read = time.time()
        compressed_ply = read_compressed_ply(input_filename)
        print(f"Compressed PLY read successfully in {time.time() - start_time_read:.2f} seconds.")

        # 2. Convert Compressed Data Directly to SPLAT Format (GPU)
        splat_data = convert_compressed_to_splat_gpu(compressed_ply)

        # 3. Write SPLAT File
        print(f"Writing SPLAT data to '{output_filename}'...")
        start_time_write = time.time()
        with open(output_filename, 'wb') as f:
            f.write(splat_data)
        print(f"Write complete in {time.time() - start_time_write:.2f} seconds.")

    except FileNotFoundError:
        print(f"Error: Input file not found: {input_filename}", file=sys.stderr)
        sys.exit(1)
    except (ValueError, MemoryError) as ve:
        print(f"Error during processing: {ve}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print("GPU conversion successful. Done.")

if __name__ == "__main__":
    main()
