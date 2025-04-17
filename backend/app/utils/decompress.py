# decompress.py
import sys
import struct
import math
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any, BinaryIO

# --- Constants (should match compress.py) ---
VERSION = "0.1.0" # Assuming a version
SH_C0 = 0.28209479177387814
SH_NAMES = [f"f_rest_{i}" for i in range(45)]
CHUNK_SIZE = 256 # Default chunk size used during compression

# --- Data Structures (from ply.txt & compress.py) ---
@dataclass
class PlyProperty:
    name: str
    type: str

@dataclass
class PlyElement:
    name: str
    count: int
    properties: List[PlyProperty] = field(default_factory=list)
    data_offset: int = 0 # Added field to store start offset in the data buffer
    item_stride: int = 0 # Added field to store size of one item in bytes

@dataclass
class PlyHeader:
    strings: List[str] = field(default_factory=list)
    elements: List[PlyElement] = field(default_factory=list)
    data_start_offset: int = 0 # Offset in the file where data begins

@dataclass
class PlyFile:
    header: PlyHeader
    data: bytes # Raw data bytes

# --- PLY Type Info (from ply.txt) ---
PLY_TYPE_MAP = {
    'char':   ('b', 1, np.int8),
    'uchar':  ('B', 1, np.uint8),
    'short':  ('<h', 2, np.int16),
    'ushort': ('<H', 2, np.uint16),
    'int':    ('<i', 4, np.int32),
    'uint':   ('<I', 4, np.uint32),
    'float':  ('<f', 4, np.float32),
    'double': ('<d', 8, np.float64)
}

def get_data_type_info(type_str: str) -> Optional[Tuple[str, int, Any]]:
    """Gets struct format, size in bytes, and numpy dtype for a PLY type string."""
    return PLY_TYPE_MAP.get(type_str)

# --- PLY Reading Logic (Adapted from compress.py) ---
def parse_ply_header(header_bytes: bytes) -> PlyHeader:
    """Parses PLY header text, calculates element offsets and strides."""
    header_str = header_bytes.decode('ascii')
    lines = [line for line in header_str.split('\n') if line.strip()]

    if not lines or lines[0] != 'ply':
        raise ValueError("Invalid PLY header: Missing 'ply' magic word.")

    header = PlyHeader(strings=lines)
    current_element: Optional[PlyElement] = None
    current_data_offset = 0 # Track offset for element data blocks

    i = 1
    while i < len(lines):
        parts = lines[i].split()
        command = parts[0]

        if command == 'format':
            if len(parts) < 3 or parts[1] != 'binary_little_endian' or parts[2] != '1.0':
                 raise ValueError(f"Unsupported PLY format: {' '.join(parts[1:])}. Only binary_little_endian 1.0 is supported.")
            i += 1
        elif command == 'comment':
            i += 1 # Skip comments
        elif command == 'element':
            if len(parts) != 3:
                raise ValueError(f"Invalid element definition: {lines[i]}")
            element_name = parts[1]
            try:
                element_count = int(parts[2])
            except ValueError:
                 raise ValueError(f"Invalid element count: {parts[2]}")

            # Store previous element's stride and offset before starting new one
            if current_element:
                 current_data_offset += current_element.item_stride * current_element.count

            current_element = PlyElement(name=element_name, count=element_count, data_offset=current_data_offset)
            header.elements.append(current_element)
            i += 1
        elif command == 'property':
            if current_element is None or len(parts) != 3:
                raise ValueError(f"Invalid property definition: {lines[i]}")
            prop_type = parts[1]
            prop_name = parts[2]
            type_info = get_data_type_info(prop_type)
            if not type_info:
                 raise ValueError(f"Invalid property type '{prop_type}' in line: {lines[i]}")

            current_element.properties.append(PlyProperty(name=prop_name, type=prop_type))
            current_element.item_stride += type_info[1] # Add size of this property to stride
            i += 1
        elif command == 'end_header':
            # Store last element's offset
            if current_element:
                 current_data_offset += current_element.item_stride * current_element.count
            break # End of header definition
        else:
             raise ValueError(f"Unrecognized header command '{command}' in line: {lines[i]}")

    if i == len(lines):
        raise ValueError("Invalid PLY header: Missing 'end_header'.")

    return header

def read_ply(filename: str) -> PlyFile:
    """Reads a PLY file (header and data)."""
    magic_bytes = b'ply\n'
    end_header_bytes = b'end_header\n'
    max_header_size = 128 * 1024 # Safety limit

    with open(filename, 'rb') as f:
        # Read and verify magic bytes
        header_chunk = f.read(len(magic_bytes))
        if header_chunk != magic_bytes:
            raise ValueError("Invalid PLY file: Incorrect magic bytes.")

        # Read until end_header, respecting max size
        header_rest = b''
        while end_header_bytes not in header_rest:
            char = f.read(1)
            if not char:
                 raise ValueError("Invalid PLY header: Reached EOF before 'end_header'.")
            header_rest += char
            if len(header_rest) + len(magic_bytes) > max_header_size:
                raise ValueError(f"PLY header exceeds maximum size of {max_header_size} bytes.")

        full_header_bytes = magic_bytes + header_rest
        # Find the actual end of the header content for parsing
        end_header_index = full_header_bytes.find(end_header_bytes)
        parseable_header_bytes = full_header_bytes[:end_header_index + len(end_header_bytes)]
        header_size_in_file = len(full_header_bytes)

        # Parse Header
        header = parse_ply_header(parseable_header_bytes)
        header.data_start_offset = header_size_in_file # Store where data actually starts

        # Read all remaining data
        f.seek(header_size_in_file)
        data = f.read()

        # Optional: Verify data size (can be complex with multiple elements)
        # expected_data_size = sum(e.item_stride * e.count for e in header.elements)
        # if len(data) != expected_data_size:
        #     print(f"Warning: Read data size {len(data)} differs from expected {expected_data_size}", file=sys.stderr)

        return PlyFile(header=header, data=data)

# --- Unpacking Functions ---

def unpack_unorm(packed_val: int, bits: int) -> float:
    """Unpacks an unsigned normalized integer back to a float in [0, 1]."""
    max_val = (1 << bits) - 1
    # Ensure packed_val is within range (can happen with bad data)
    clamped_val = max(0, min(max_val, packed_val))
    return float(clamped_val) / max_val

def unpack_11_10_11(packed_val: int) -> Tuple[float, float, float]:
    """Unpacks a 32-bit int into three floats (11, 10, 11 bits)."""
    x = unpack_unorm((packed_val >> 21) & 0x7FF, 11) # 11 bits
    y = unpack_unorm((packed_val >> 11) & 0x3FF, 10) # 10 bits
    z = unpack_unorm( packed_val        & 0x7FF, 11) # 11 bits
    return x, y, z

def unpack_8888(packed_val: int) -> Tuple[float, float, float, float]:
    """Unpacks a 32-bit int into four floats (8 bits each)."""
    x = unpack_unorm((packed_val >> 24) & 0xFF, 8)
    y = unpack_unorm((packed_val >> 16) & 0xFF, 8)
    z = unpack_unorm((packed_val >> 8)  & 0xFF, 8)
    w = unpack_unorm( packed_val        & 0xFF, 8)
    return x, y, z, w

def unpack_rot(packed_val: int) -> Tuple[float, float, float, float]:
    """Unpacks a 32-bit int (2,10,10,10 format) into a normalized quaternion (x, y, z, w)."""
    largest_idx = (packed_val >> 30) & 0x3 # 2 bits for index
    norm = math.sqrt(2) * 0.5 # Normalization factor used during packing

    # Unpack the 3 packed components (10 bits each)
    vals = [0.0] * 3
    packed_comps = packed_val & 0x3FFFFFFF # Mask out the largest_idx bits
    for i in range(2, -1, -1):
        unorm_val = unpack_unorm(packed_comps & 0x3FF, 10)
        # Reverse the normalization: unorm_val = q[i] * norm + 0.5 => q[i] = (unorm_val - 0.5) / norm
        vals[i] = (unorm_val - 0.5) / norm
        packed_comps >>= 10

    # Reconstruct the quaternion
    q = [0.0] * 4
    current_val_idx = 0
    sum_sq = 0.0
    for i in range(4):
        if i == largest_idx:
            continue # Skip the largest component for now
        q[i] = vals[current_val_idx]
        sum_sq += q[i] * q[i]
        current_val_idx += 1

    # Calculate the largest component using the unit quaternion property: x^2+y^2+z^2+w^2 = 1
    if sum_sq >= 1.0:
        # Should not happen with valid data, but handle potential precision issues
        q[largest_idx] = 0.0
        # Renormalize if necessary
        norm_factor = math.sqrt(sum_sq)
        if norm_factor > 1e-6:
             for i in range(4):
                 if i != largest_idx: q[i] /= norm_factor
    else:
        q[largest_idx] = math.sqrt(1.0 - sum_sq)

    # The packing ensures w >= 0, so no need to flip sign here.
    # Return in standard (x, y, z, w) order
    return q[0], q[1], q[2], q[3]

def inverse_sigmoid(y: float) -> float:
    """Reverses the sigmoid function. Clamps input to avoid math errors."""
    # Clamp y slightly away from 0 and 1
    epsilon = 1e-7
    y_clamped = max(epsilon, min(1.0 - epsilon, y))
    try:
        return -math.log((1.0 / y_clamped) - 1.0)
    except ValueError: # Should not happen with clamping
        return 0.0 # Fallback

def dequantize_sh(quantized_val: int) -> float:
    """Reverses the SH quantization used in compress.py."""
    # Original quantization: quantized_val = max(0, min(255, int((single_sh_data[k] / 8.0 + 0.5) * 256)))
    # Reverse:
    nvalue = float(quantized_val) / 256.0 # Map [0, 255] to [0, ~1]
    value = (nvalue - 0.5) * 8.0         # Map [0, ~1] to [-4, ~4]
    return value

def denormalize(norm_val: float, min_v: float, max_v: float) -> float:
    """Denormalizes a value from [0, 1] back to its original range [min_v, max_v]."""
    if max_v == min_v: # Avoid division by zero if range is zero
        return min_v
    return norm_val * (max_v - min_v) + min_v

# --- Decompression Logic ---

def decompress_ply_data(ply_file: PlyFile) -> Tuple[PlyHeader, np.ndarray]:
    """
    Decompresses the data from a .compressed.ply file into a standard float vertex array.

    Returns:
        - A new PlyHeader suitable for a standard float PLY file.
        - A NumPy array containing the decompressed vertex data (structured array).
    """
    print("Starting decompression...")

    # --- Find Compressed Elements ---
    chunk_element: Optional[PlyElement] = None
    vertex_element: Optional[PlyElement] = None
    sh_element: Optional[PlyElement] = None

    for elem in ply_file.header.elements:
        if elem.name == 'chunk':
            chunk_element = elem
        elif elem.name == 'vertex':
            vertex_element = elem
        elif elem.name == 'sh':
            sh_element = elem

    if not chunk_element or not vertex_element:
        raise ValueError("Compressed PLY file missing 'chunk' or 'vertex' element.")

    num_splats = vertex_element.count
    num_chunks = chunk_element.count
    print(f"Found {num_splats} splats in {num_chunks} chunks.")

    has_sh = sh_element is not None
    num_sh_coeffs = 0
    num_sh_props_per_splat = 0
    if has_sh:
        num_sh_props_per_splat = len(sh_element.properties)
        if num_sh_props_per_splat % 3 != 0:
             raise ValueError(f"Number of SH properties ({num_sh_props_per_splat}) is not a multiple of 3.")
        num_sh_coeffs = num_sh_props_per_splat // 3
        print(f"Found {num_sh_coeffs * 3} SH properties per splat.")
    else:
        print("No SH element found.")

    # --- Prepare Output Data Structure ---
    # Define the dtype for the standard output vertex data
    output_dtype_list = [
        ('x', np.float32), ('y', np.float32), ('z', np.float32),
        ('nx', np.float32), ('ny', np.float32), ('nz', np.float32), # Normals often included, default to 0
        ('f_dc_0', np.float32), ('f_dc_1', np.float32), ('f_dc_2', np.float32)
    ]
    if has_sh:
        output_dtype_list.extend([(f'f_rest_{i}', np.float32) for i in range(num_sh_props_per_splat)])

    output_dtype_list.extend([
        ('opacity', np.float32),
        ('scale_0', np.float32), ('scale_1', np.float32), ('scale_2', np.float32),
        ('rot_0', np.float32), ('rot_1', np.float32), ('rot_2', np.float32), ('rot_3', np.float32)
    ])

    output_dtype = np.dtype(output_dtype_list)
    decompressed_vertices = np.zeros(num_splats, dtype=output_dtype)

    # --- Access Compressed Data Blocks ---
    data = ply_file.data

    # Chunk Header Data (Floats)
    chunk_props_count = len(chunk_element.properties)
    chunk_data_size = chunk_element.count * chunk_element.item_stride
    chunk_headers = np.frombuffer(data, dtype=np.float32, count=chunk_element.count * chunk_props_count, offset=chunk_element.data_offset)
    chunk_headers = chunk_headers.reshape((chunk_element.count, chunk_props_count)) # Reshape for easier access

    # Vertex Data (Packed Uint32)
    vertex_props_count = len(vertex_element.properties) # Should be 4: pos, rot, scale, color
    vertex_data_size = vertex_element.count * vertex_element.item_stride
    packed_vertex_data = np.frombuffer(data, dtype=np.uint32, count=vertex_element.count * vertex_props_count, offset=vertex_element.data_offset)
    packed_vertex_data = packed_vertex_data.reshape((vertex_element.count, vertex_props_count))

    # SH Data (Quantized Uint8)
    quantized_sh_data = None
    if has_sh:
        sh_data_size = sh_element.count * sh_element.item_stride
        quantized_sh_data = np.frombuffer(data, dtype=np.uint8, count=sh_element.count * num_sh_props_per_splat, offset=sh_element.data_offset)
        quantized_sh_data = quantized_sh_data.reshape((sh_element.count, num_sh_props_per_splat))

    # --- Decompress Each Splat ---
    print("Decompressing splats...")
    for i in range(num_splats):
        chunk_idx = i // CHUNK_SIZE
        if chunk_idx >= num_chunks:
             print(f"Warning: Splat index {i} exceeds expected number of chunks {num_chunks}. Skipping.", file=sys.stderr)
             continue

        # Get chunk min/max values (assuming standard order from compress.py)
        ch = chunk_headers[chunk_idx]
        px_min, py_min, pz_min, px_max, py_max, pz_max = ch[0:6]
        sx_min, sy_min, sz_min, sx_max, sy_max, sz_max = ch[6:12] # Corrected potential typo index from compress.py
        cr_min, cg_min, cb_min, cr_max, cg_max, cb_max = ch[12:18]

        # Get packed data for this splat
        packed_pos, packed_rot, packed_scale, packed_color = packed_vertex_data[i]

        # Unpack Position
        norm_x, norm_y, norm_z = unpack_11_10_11(packed_pos)
        decompressed_vertices['x'][i] = denormalize(norm_x, px_min, px_max)
        decompressed_vertices['y'][i] = denormalize(norm_y, py_min, py_max)
        decompressed_vertices['z'][i] = denormalize(norm_z, pz_min, pz_max)

        # Unpack Rotation
        rot_x, rot_y, rot_z, rot_w = unpack_rot(packed_rot)
        decompressed_vertices['rot_0'][i] = rot_x
        decompressed_vertices['rot_1'][i] = rot_y
        decompressed_vertices['rot_2'][i] = rot_z
        decompressed_vertices['rot_3'][i] = rot_w

        # Unpack Scale
        norm_sx, norm_sy, norm_sz = unpack_11_10_11(packed_scale)
        # Note: We are denormalizing based on the *clamped* min/max range used during compression.
        # The original scale values outside this range are lost.
        decompressed_vertices['scale_0'][i] = denormalize(norm_sx, sx_min, sx_max)
        decompressed_vertices['scale_1'][i] = denormalize(norm_sy, sy_min, sy_max)
        decompressed_vertices['scale_2'][i] = denormalize(norm_sz, sz_min, sz_max)

        # Unpack Color and Opacity
        norm_r, norm_g, norm_b, norm_a = unpack_8888(packed_color)
        # Denormalize Color
        r = denormalize(norm_r, cr_min, cr_max)
        g = denormalize(norm_g, cg_min, cg_max)
        b = denormalize(norm_b, cb_min, cb_max)
        # Convert back from [0, 1] range to f_dc space using SH_C0
        decompressed_vertices['f_dc_0'][i] = (r - 0.5) / SH_C0
        decompressed_vertices['f_dc_1'][i] = (g - 0.5) / SH_C0
        decompressed_vertices['f_dc_2'][i] = (b - 0.5) / SH_C0
        # Inverse Sigmoid for Opacity
        decompressed_vertices['opacity'][i] = inverse_sigmoid(norm_a)

        # Dequantize SH
        if has_sh and quantized_sh_data is not None:
            quantized_sh_values = quantized_sh_data[i]
            for sh_idx in range(num_sh_props_per_splat):
                sh_prop_name = f'f_rest_{sh_idx}'
                decompressed_vertices[sh_prop_name][i] = dequantize_sh(quantized_sh_values[sh_idx])

        # Set default normals (often expected by viewers)
        decompressed_vertices['nx'][i] = 0.0
        decompressed_vertices['ny'][i] = 0.0
        decompressed_vertices['nz'][i] = 0.0


    # --- Create Standard PLY Header ---
    output_header = PlyHeader(strings=[
        'ply',
        'format binary_little_endian 1.0',
        f'comment Decompressed from compressed PLY by decompress.py {VERSION}',
        f'element vertex {num_splats}'
    ])
    output_element = PlyElement(name='vertex', count=num_splats)
    for name, _ in output_dtype.descr: # Use names from the dtype we created
         output_element.properties.append(PlyProperty(name=name, type='float'))
         output_header.strings.append(f'property float {name}')

    output_header.elements.append(output_element)
    output_header.strings.append('end_header\n') # Add newline for writing

    print("Decompression finished.")
    return output_header, decompressed_vertices

# --- PLY Writing ---

def write_standard_ply(output_filename: str, header: PlyHeader, vertex_data: np.ndarray):
    """Writes a standard PLY file with float vertex data."""
    print(f"Writing standard PLY to '{output_filename}'...")
    header_text = '\n'.join(header.strings)
    header_bytes = header_text.encode('ascii')

    with open(output_filename, 'wb') as f:
        f.write(header_bytes)
        f.write(vertex_data.tobytes())
    print("Write complete.")

# --- Main Execution Logic ---
def main():
    print(f"PLY Decompressor v{VERSION}")

    if len(sys.argv) < 3:
        print("Usage: python decompress.py <input-compressed.ply> <output-standard.ply>", file=sys.stderr)
        sys.exit(1)

    input_filename = sys.argv[1]
    output_filename = sys.argv[2]

    try:
        # Read Compressed Data
        print(f"Loading compressed file '{input_filename}'...")
        compressed_ply = read_ply(input_filename)
        print("Compressed PLY read successfully.")

        # Decompress
        standard_header, standard_vertex_data = decompress_ply_data(compressed_ply)

        # Write Standard PLY
        write_standard_ply(output_filename, standard_header, standard_vertex_data)

    except FileNotFoundError:
         print(f"Error: Input file not found: {input_filename}", file=sys.stderr)
         sys.exit(1)
    except ValueError as ve:
        print(f"Error processing compressed PLY file: {ve}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print("Done.")

if __name__ == "__main__":
    main()