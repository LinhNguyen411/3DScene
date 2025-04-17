# convert_compressed_ply_to_splat_direct_parallel.py
import sys
import struct
import math
import numpy as np
import time
import multiprocessing
import ctypes
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any, BinaryIO

# --- Constants ---
VERSION = "0.3.0" # Updated version for parallel conversion
SH_C0 = 0.28209479177387814 # Constant for SH DC color conversion
CHUNK_SIZE_COMPRESSION = 256 # Default chunk size used during compression (renamed to avoid confusion)

# --- Data Structures ---
# (PlyProperty, PlyElement, PlyHeader, PlyFile remain the same as before)
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

def denormalize(norm_val: float, min_v: float, max_v: float) -> float:
    if max_v == min_v: return min_v
    return norm_val * (max_v - min_v) + min_v

# --- Unpacking Functions ---
# (unpack_unorm, unpack_11_10_11, unpack_8888, unpack_rot remain the same)
def unpack_unorm(packed_val: int, bits: int) -> float:
    max_val = (1 << bits) - 1
    clamped_val = max(0, min(max_val, packed_val & max_val))
    return float(clamped_val) / max_val

def unpack_11_10_11(packed_val: int) -> Tuple[float, float, float]:
    x = unpack_unorm((packed_val >> 21) & 0x7FF, 11)
    y = unpack_unorm((packed_val >> 11) & 0x3FF, 10)
    z = unpack_unorm( packed_val        & 0x7FF, 11)
    return x, y, z

def unpack_8888(packed_val: int) -> Tuple[float, float, float, float]:
    x = unpack_unorm((packed_val >> 24) & 0xFF, 8)
    y = unpack_unorm((packed_val >> 16) & 0xFF, 8)
    z = unpack_unorm((packed_val >> 8)  & 0xFF, 8)
    w = unpack_unorm( packed_val        & 0xFF, 8)
    return x, y, z, w

def unpack_rot(packed_val: int) -> Tuple[float, float, float, float]:
    largest_idx = (packed_val >> 30) & 0x3
    norm = 0.7071067811865475 # sqrt(2)/2
    vals = [0.0] * 3
    packed_comps = packed_val & 0x3FFFFFFF
    for i in range(2, -1, -1):
        ten_bit_val = packed_comps & 0x3FF
        unorm_val = unpack_unorm(ten_bit_val, 10)
        vals[i] = (unorm_val - 0.5) / norm
        packed_comps >>= 10
    q = [0.0] * 4
    current_val_idx = 0
    sum_sq = 0.0
    for i in range(4):
        if i == largest_idx: continue
        q[i] = vals[current_val_idx]
        sum_sq += q[i] * q[i]
        current_val_idx += 1
    if sum_sq >= 1.0:
        q[largest_idx] = 0.0
        norm_factor = math.sqrt(sum_sq) if sum_sq > 1e-12 else 1.0
        if norm_factor > 1e-6:
             for i in range(4):
                 if i != largest_idx: q[i] /= norm_factor
    else:
        q[largest_idx] = math.sqrt(1.0 - sum_sq)
    return q[0], q[1], q[2], q[3] # x, y, z, w

# --- PLY Reading Logic ---
# (parse_ply_header, read_compressed_ply remain the same)
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

# --- Parallel Worker Functions ---

# Global variables to hold data accessible by worker processes
# Avoids pickling large arrays for each task (especially on Windows)
packed_vertex_data_global = None
chunk_headers_global = None
size_index_global = None
shared_buffer_global = None
num_chunks_global = 0
row_length_global = 0

def init_workers(packed_vertex_data, chunk_headers, size_index, shared_buffer, num_chunks, row_length):
    """Initializer for worker processes to set global variables."""
    global packed_vertex_data_global, chunk_headers_global, size_index_global
    global shared_buffer_global, num_chunks_global, row_length_global
    packed_vertex_data_global = packed_vertex_data
    chunk_headers_global = chunk_headers
    size_index_global = size_index
    shared_buffer_global = shared_buffer
    num_chunks_global = num_chunks
    row_length_global = row_length
    # print(f"Worker {os.getpid()} initialized.") # Optional: for debugging

def calculate_importance_worker(indices: Tuple[int, int]) -> List[Tuple[int, float]]:
    """Calculates importance for a given range of vertex indices."""
    start_idx, end_idx = indices
    results = []
    # Access data via global variables
    for i in range(start_idx, end_idx):
        chunk_idx = i // CHUNK_SIZE_COMPRESSION
        if chunk_idx >= num_chunks_global: continue

        ch = chunk_headers_global[chunk_idx]
        sx_min, sy_min, sz_min, sx_max, sy_max, sz_max = ch[6:12]

        packed_scale = packed_vertex_data_global[i, 2]
        packed_color = packed_vertex_data_global[i, 3]

        norm_sx, norm_sy, norm_sz = unpack_11_10_11(packed_scale)
        scale_0 = denormalize(norm_sx, sx_min, sx_max)
        scale_1 = denormalize(norm_sy, sy_min, sy_max)
        scale_2 = denormalize(norm_sz, sz_min, sz_max)
        try:
            size = math.exp(scale_0) * math.exp(scale_1) * math.exp(scale_2)
        except OverflowError:
            size = float('inf') # Handle potential overflow with large scales

        norm_a = unpack_unorm(packed_color & 0xFF, 8)
        opacity_val = norm_a

        results.append((i, size * opacity_val)) # Return index and importance
    return results

def process_splat_worker(indices: Tuple[int, int]):
    """Processes a chunk of sorted indices to build the SPLAT buffer."""
    j_start, j_end = indices
    # Create a memoryview or cast the shared buffer for efficient access
    # Note: Direct access to RawArray is possible, but casting might be cleaner
    buffer_view = memoryview(shared_buffer_global)

    # Access other data via global variables
    for j in range(j_start, j_end):
        original_idx = size_index_global[j]

        splat_row_offset = j * row_length_global
        pos_offset = splat_row_offset
        scl_offset = pos_offset + 12
        rgb_offset = scl_offset + 12
        rot_offset = rgb_offset + 4

        chunk_idx = original_idx // CHUNK_SIZE_COMPRESSION
        if chunk_idx >= num_chunks_global: continue
        ch = chunk_headers_global[chunk_idx]
        px_min, py_min, pz_min, px_max, py_max, pz_max = ch[0:6]
        sx_min, sy_min, sz_min, sx_max, sy_max, sz_max = ch[6:12]
        cr_min, cg_min, cb_min, cr_max, cg_max, cb_max = ch[12:18]

        packed_pos, packed_rot, packed_scale, packed_color = packed_vertex_data_global[original_idx]

        # --- Position ---
        norm_x, norm_y, norm_z = unpack_11_10_11(packed_pos)
        pos_x = denormalize(norm_x, px_min, px_max)
        pos_y = denormalize(norm_y, py_min, py_max)
        pos_z = denormalize(norm_z, pz_min, pz_max)
        struct.pack_into('<3f', buffer_view, pos_offset, pos_x, pos_y, pos_z)

        # --- Scale ---
        norm_sx, norm_sy, norm_sz = unpack_11_10_11(packed_scale)
        scale_0 = denormalize(norm_sx, sx_min, sx_max)
        scale_1 = denormalize(norm_sy, sy_min, sy_max)
        scale_2 = denormalize(norm_sz, sz_min, sz_max)
        try:
            final_scale_0 = math.exp(scale_0)
            final_scale_1 = math.exp(scale_1)
            final_scale_2 = math.exp(scale_2)
        except OverflowError:
             final_scale_0 = final_scale_1 = final_scale_2 = 1e6 # Assign large value on overflow
        struct.pack_into('<3f', buffer_view, scl_offset, final_scale_0, final_scale_1, final_scale_2)

        # --- Color ---
        norm_r, norm_g, norm_b, norm_a = unpack_8888(packed_color)
        denorm_r = denormalize(norm_r, cr_min, cr_max)
        denorm_g = denormalize(norm_g, cg_min, cg_max)
        denorm_b = denormalize(norm_b, cb_min, cb_max)
        alpha_byte = clamp(int(norm_a * 255.99)) # Use 255.99 for better rounding to 255
        r_byte = clamp(int(denorm_r * 255.99))
        g_byte = clamp(int(denorm_g * 255.99))
        b_byte = clamp(int(denorm_b * 255.99))
        struct.pack_into('<4B', buffer_view, rgb_offset, r_byte, g_byte, b_byte, alpha_byte)

        # --- Rotation ---
        rot_x, rot_y, rot_z, rot_w = unpack_rot(packed_rot)
        qlen_sq = rot_x*rot_x + rot_y*rot_y + rot_z*rot_z + rot_w*rot_w
        if qlen_sq < 1e-12:
             rot_packed_bytes = (128, 128, 128, 128) # Neutral midpoint for zero rotation? Or 0,0,0,255? Check spec. Using midpoint.
        else:
            qlen = math.sqrt(qlen_sq)
            rx_norm, ry_norm, rz_norm, rw_norm = rot_x/qlen, rot_y/qlen, rot_z/qlen, rot_w/qlen
            # Map [-1, 1] to [0, 255]
            rot_packed_bytes = (
                clamp(int(rx_norm * 127.5 + 127.5)), # Map to [0, 255]
                clamp(int(ry_norm * 127.5 + 127.5)),
                clamp(int(rz_norm * 127.5 + 127.5)),
                clamp(int(rw_norm * 127.5 + 127.5))
            )
        # Pack bytes (assuming x,y,z,w order, check viewer if needed)
        struct.pack_into('<4B', buffer_view, rot_offset, *rot_packed_bytes)
    # No return value needed as we modify the shared buffer directly

# --- Direct Compressed PLY to SPLAT Conversion Logic (Parallelized) ---
def convert_compressed_to_splat_direct_parallel(ply_file: PlyFile, num_processes: Optional[int] = None) -> bytes:
    """
    Directly converts data using multiprocessing.
    """
    if num_processes is None:
        num_processes = multiprocessing.cpu_count()
    print(f"Starting direct parallel conversion using {num_processes} processes...")
    start_time_direct = time.time()

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

    # --- Parallel Importance Calculation ---
    print("Calculating importance (parallel)...")
    start_time_importance = time.time()
    importance_results = []
    # Define chunk size for tasks
    task_chunk_size = max(1, num_splats // (num_processes * 4)) # Heuristic: more tasks than processes
    tasks = [(i, min(i + task_chunk_size, num_splats)) for i in range(0, num_splats, task_chunk_size)]

    # Use initializer to pass large data efficiently
    with multiprocessing.Pool(processes=num_processes,
                              initializer=init_workers,
                              initargs=(packed_vertex_data, chunk_headers, None, None, num_chunks, 0)) as pool:
        # Map tasks to worker function
        results_list = pool.map(calculate_importance_worker, tasks)

    # Combine results
    importance_map = {}
    for result_chunk in results_list:
        for idx, imp in result_chunk:
            importance_map[idx] = imp
    # Ensure importance array is correctly ordered
    importance = np.array([importance_map[i] for i in range(num_splats)])

    print(f"Importance calculation took: {time.time() - start_time_importance:.2f} seconds")

    # --- Sort vertices by importance (descending) ---
    print("Sorting vertices by importance...")
    start_time_sort = time.time()
    size_index = np.argsort(importance)[::-1].astype(np.uint32) # Ensure index is int
    print(f"Sorting took: {time.time() - start_time_sort:.2f} seconds")
    del importance, importance_map, results_list # Free memory

    # --- Parallel SPLAT Buffer Building ---
    print("Building SPLAT buffer (parallel)...")
    start_time_build = time.time()
    row_length = 3 * 4 + 3 * 4 + 4 + 4
    try:
        # Create shared memory buffer
        shared_buffer = multiprocessing.RawArray(ctypes.c_byte, row_length * num_splats)
    except OverflowError:
         raise MemoryError(f"Cannot allocate shared buffer of size {row_length * num_splats} bytes. Input too large.")


    # Define tasks for building the buffer (indices refer to the sorted order `j`)
    task_chunk_size_build = max(1, num_splats // (num_processes * 4))
    build_tasks = [(j, min(j + task_chunk_size_build, num_splats)) for j in range(0, num_splats, task_chunk_size_build)]

    # Run worker processes to fill the shared buffer
    with multiprocessing.Pool(processes=num_processes,
                              initializer=init_workers,
                              initargs=(packed_vertex_data, chunk_headers, size_index, shared_buffer, num_chunks, row_length)) as pool:
        pool.map(process_splat_worker, build_tasks)

    print(f"SPLAT buffer build took: {time.time() - start_time_build:.2f} seconds")
    print(f"Total parallel conversion time: {time.time() - start_time_direct:.2f} seconds")

    # Return the content of the shared buffer as bytes
    return bytes(shared_buffer)

def convert_ply_file_to_splat_buffer(file_path: str, num_processes: Optional[int] = None) -> bytes:
    """
    Converts a compressed PLY file to SPLAT format and returns the SPLAT data as bytes.

    Args:
        file_path (str): Path to the input .compressed.ply file (e.g., splat.model_url).
        num_processes (Optional[int]): Number of processes to use for parallel conversion. Defaults to None (uses all available CPUs).

    Returns:
        bytes: The SPLAT data as a byte buffer.

    Raises:
        FileNotFoundError: If the input file does not exist.
        ValueError: If the PLY file is invalid or missing required elements.
        MemoryError: If the buffer allocation fails due to insufficient memory.
    """
    compressed_ply = read_compressed_ply(file_path)
    splat_data = convert_compressed_to_splat_direct_parallel(compressed_ply, num_processes)
    return splat_data


# --- Main Execution Logic ---
def main():
    print(f"Direct Compressed PLY to SPLAT Converter (Parallel) v{VERSION}")

    if len(sys.argv) < 3:
        print("Usage: python convert_compressed_ply_to_splat_direct_parallel.py <input.compressed.ply> <output.splat> [num_processes]", file=sys.stderr)
        sys.exit(1)

    input_filename = sys.argv[1]
    output_filename = sys.argv[2]
    num_processes = None
    if len(sys.argv) > 3:
        try:
            num_processes = int(sys.argv[3])
            if num_processes <= 0:
                raise ValueError("Number of processes must be positive.")
        except ValueError as e:
            print(f"Error: Invalid number of processes specified. {e}", file=sys.stderr)
            sys.exit(1)

    try:
        # 1. Read Compressed PLY File
        print(f"Loading compressed file '{input_filename}'...")
        start_time_read = time.time()
        compressed_ply = read_compressed_ply(input_filename)
        print(f"Compressed PLY read successfully in {time.time() - start_time_read:.2f} seconds.")

        # 2. Convert Compressed Data Directly to SPLAT Format (Parallel)
        splat_data = convert_compressed_to_splat_direct_parallel(compressed_ply, num_processes)

        # 3. Write SPLAT File
        print(f"Writing SPLAT data to '{output_filename}'...")
        start_time_write = time.time()
        with open(output_filename, 'wb') as f:
            f.write(splat_data)
        print(f"Write complete in {time.time() - start_time_write:.2f} seconds.")

    except FileNotFoundError:
         print(f"Error: Input file not found: {input_filename}", file=sys.stderr)
         sys.exit(1)
    except (ValueError, MemoryError) as ve: # Catch MemoryError too
        print(f"Error during processing: {ve}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print("Conversion successful. Done.")

# Crucial for multiprocessing, especially on Windows
if __name__ == "__main__":
    # Freeze support might be needed for bundled applications
    # multiprocessing.freeze_support()
    main()
