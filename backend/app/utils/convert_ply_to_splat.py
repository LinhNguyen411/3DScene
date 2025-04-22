import struct
import numpy as np
import time
import concurrent.futures
from functools import partial

TYPE_MAP = {
    'double': 'd',
    'int': 'i',
    'uint': 'I',
    'float': 'f',
    'short': 'h',
    'ushort': 'H',
    'uchar': 'B',
}

def clamp(value, min_value=0, max_value=255):
    return max(min_value, min(value, max_value))

def process_batch_importance(start_idx, end_idx, input_buffer, data_offset, types, offsets, row_offset):
    """Process a batch of vertices to calculate importance"""
    batch_size = end_idx - start_idx
    size_list = np.zeros(batch_size, dtype=np.float32)
    
    def get_attr(name, row):
        if name not in types:
            raise ValueError(f"{name} not found")
        return struct.unpack_from(types[name], input_buffer, data_offset + row * row_offset + offsets[name])[0]
    
    for i, row in enumerate(range(start_idx, end_idx)):
        if "scale_0" not in types:
            continue
        size = np.exp(get_attr('scale_0', row)) * np.exp(get_attr('scale_1', row)) * np.exp(get_attr('scale_2', row))
        opacity = 1 / (1 + np.exp(-get_attr('opacity', row)))
        size_list[i] = size * opacity
        
    return size_list

def process_batch_buffer(indices, input_buffer, data_offset, types, offsets, row_offset, row_length):
    """Process a batch of vertices to build the output buffer"""
    batch_size = len(indices)
    buffer = bytearray(row_length * batch_size)
    
    def get_attr(name, row):
        if name not in types:
            raise ValueError(f"{name} not found")
        return struct.unpack_from(types[name], input_buffer, data_offset + row * row_offset + offsets[name])[0]
    
    for j, row in enumerate(indices):
        position_offset = j * row_length
        scales_offset = position_offset + 4 * 3
        rgba_offset = scales_offset + 4 * 3
        rot_offset = rgba_offset + 4
        
        if "scale_0" in types:
            qlen = np.sqrt(sum(get_attr(f'rot_{i}', row)**2 for i in range(4)))

            rot_values = [(get_attr(f'rot_{i}', row) / qlen) * 128 + 128 for i in range(4)]
            buffer[rot_offset:rot_offset+4] = struct.pack('4B', *map(int, rot_values))

            scales_values = [np.exp(get_attr(f'scale_{i}', row)) for i in range(3)]
            buffer[scales_offset:scales_offset+12] = struct.pack('3f', *scales_values)
        else:
            buffer[scales_offset:scales_offset+12] = struct.pack('3f', 0.01, 0.01, 0.01)
            buffer[rot_offset:rot_offset+4] = struct.pack('4B', 255, 0, 0, 0)

        position_values = [get_attr(axis, row) for axis in ('x', 'y', 'z')]
        buffer[position_offset:position_offset+12] = struct.pack('3f', *position_values)
        
        if "f_dc_0" in types:
            SH_C0 = 0.28209479177387814
            rgba_values = [(0.5 + SH_C0 * get_attr(f'f_dc_{i}', row)) * 255 for i in range(3)]
        else:
            rgba_values = [get_attr(color, row) for color in ('red', 'green', 'blue')]
        
        if "opacity" in types:
            opacity = (1 / (1 + np.exp(-get_attr('opacity', row)))) * 255
        else:
            opacity = 255
        
        buffer[rgba_offset:rgba_offset+4] = struct.pack('4B', 
            clamp(int(rgba_values[0])),
            clamp(int(rgba_values[1])),
            clamp(int(rgba_values[2])),
            clamp(int(opacity))
        )
    
    return buffer

def process_ply_buffer(input_path, output_path, num_threads=None):
    try:
        with open(input_path, 'rb') as f:
            input_buffer = f.read()
    except Exception as e:
        raise ValueError(f"Unable to read .ply file: {e}")
    
    header_end = b"end_header\n"
    header_end_index = input_buffer.find(header_end)
    if header_end_index < 0:
        raise ValueError("Unable to read .ply file header")
    
    header = input_buffer[:header_end_index].decode()
    
    vertex_count = int(next((int(s.split()[-1]) for s in header.splitlines() if s.startswith("element vertex")), None))
    print("Vertex Count", vertex_count)

    row_offset = 0
    offsets = {}
    types = {}

    for prop in (s for s in header.splitlines() if s.startswith("property ")):
        _, type_, name = prop.split()
        array_type = TYPE_MAP[type_]
        types[name] = array_type
        offsets[name] = row_offset
        row_offset += struct.calcsize(array_type)

    print("Bytes per row", row_offset, types, offsets)
    
    data_offset = header_end_index + len(header_end)
    
    # Calculate optimal batch size based on vertex count and available workers
    if num_threads is None:
        num_threads = min(32, max(4, concurrent.futures.cpu_count()))
    
    batch_size = max(1, vertex_count // num_threads)
    
    # Calculate importance values in parallel
    size_list = np.zeros(vertex_count, dtype=np.float32)
    
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = []
        
        for i in range(0, vertex_count, batch_size):
            end_idx = min(i + batch_size, vertex_count)
            futures.append(executor.submit(
                process_batch_importance, 
                i, end_idx, input_buffer, data_offset, types, offsets, row_offset))
        
        # Collect results
        for i, future in enumerate(futures):
            start_idx = i * batch_size
            end_idx = min(start_idx + batch_size, vertex_count)
            size_list[start_idx:end_idx] = future.result()
    
    print("calculate importance:", time.time() - start_time, "seconds")

    # Sort vertices by importance
    start_time = time.time()
    size_index = np.argsort(size_list)[::-1]
    print("sort:", time.time() - start_time, "seconds")

    # Define the output buffer structure
    row_length = 3 * 4 + 3 * 4 + 4 + 4
    
    # Process vertices in parallel to build the output buffer
    start_time = time.time()
    buffers = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = []
        
        for i in range(0, vertex_count, batch_size):
            end_idx = min(i + batch_size, vertex_count)
            batch_indices = size_index[i:end_idx]
            futures.append(executor.submit(
                process_batch_buffer,
                batch_indices, input_buffer, data_offset, types, offsets, row_offset, row_length))
        
        # Collect results in the correct order
        for future in concurrent.futures.as_completed(futures):
            buffers.append(future.result())
    
    # Combine the buffers in the correct order
    final_buffer = bytearray()
    for i in range(0, vertex_count, batch_size):
        batch_idx = i // batch_size
        if batch_idx < len(buffers):
            final_buffer.extend(buffers[batch_idx])
    
    print("build buffer:", time.time() - start_time, "seconds")
    
    try:
        with open(output_path, 'wb') as f:
            f.write(final_buffer)
        print("write file success")
    except Exception as e:
        raise ValueError(f"Error writing the file: {e}")