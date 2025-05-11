# export_to_json.py
import argparse
import json
import os
import numpy as np

# Attempt to import from read_write_model.py
# This assumes read_write_model.py is in the same directory or PYTHONPATH
try:
    from app.utils.read_write_model import read_model, qvec2rotmat, rotmat2qvec, Camera, Point3D
except ImportError:
    print("Error: read_write_model.py not found. "
          "Please ensure it's in the same directory as this script, "
          "or installed in a directory listed in PYTHONPATH.")
    exit(1) # Exiting with a non-zero code indicates an error

def export_cameras_to_json(cameras, images, output_cameras_json_path):
    """
    Exports camera poses from a COLMAP model to a JSON file.
    The output format is a list of dictionaries, each with "position",
    "quaternion", "name", "image_width", and "image_height".

    Args:
        cameras (dict): Dictionary of Camera objects from read_model.
        images (dict): Dictionary of Image objects from read_model.
        output_cameras_json_path (str): Path to save the output cameras JSON file.
    """
    if not images:
        print(f"No images found. Camera JSON file will be empty or not created.")
        try:
            with open(output_cameras_json_path, 'w') as f:
                json.dump([], f, indent=2)
            print(f"Empty JSON array written to: {output_cameras_json_path}")
        except IOError as e:
            print(f"Error writing empty JSON file: {e}")
        return

    if not cameras:
        print(f"No cameras data found. Cannot add image width and height. Camera JSON file will be empty or not created.")
        try:
            with open(output_cameras_json_path, 'w') as f:
                json.dump([], f, indent=2)
            print(f"Empty JSON array written to: {output_cameras_json_path}")
        except IOError as e:
            print(f"Error writing empty JSON file: {e}")
        return

    camera_data_list = []
    # Sort by image_id for a consistent output order
    for image_id in sorted(images.keys()):
        image_obj = images[image_id]

        cam = cameras.get(image_obj.camera_id)
        if not cam:
            print(f"Warning: Camera ID {image_obj.camera_id} for image {image_obj.name} not found in cameras data. Skipping width/height for this entry.")
            image_width = None
            image_height = None
        else:
            image_width = cam.width
            image_height = cam.height
        
        q_cw = image_obj.qvec
        # t_cw is the translation vector from COLMAP, transforming points from world to camera frame.
        t_cw = image_obj.tvec
        name = image_obj.name

        # Convert q_cw to rotation matrix R_cw (world to camera).
        # This is needed for calculating the camera position in world coordinates.
        R_cw = qvec2rotmat(q_cw)

        # Calculate camera center in world coordinates (C_w) in COLMAP's native coordinate system.
        # C_w = -R_cw^T * t_cw.
        position_np_colmap = -np.dot(R_cw.T, t_cw) # This is [X_colmap, Y_colmap, Z_colmap]

        # Apply transformation: Negate the X and Y coordinates.
        # Target position: [-X_colmap, -Y_colmap, Z_colmap]
        position = [position_np_colmap[0], position_np_colmap[1], position_np_colmap[2]]
        
        quaternion_np = rotmat2qvec(R_cw)
        quaternion = quaternion_np.tolist() # Convert numpy array to list

        camera_entry = {
            "position": position,
            "quaternion": quaternion,
            "name": name,
            "image_width": image_width,
            "image_height": image_height
        }
        camera_data_list.append(camera_entry)

    print(f"Processed {len(camera_data_list)} camera poses.")
    print(f"Writing camera JSON data to: {output_cameras_json_path}")
    try:
        with open(output_cameras_json_path, 'w') as f:
            json.dump(camera_data_list, f, indent=2)
        print(f"Successfully exported camera data to '{output_cameras_json_path}'.")
    except IOError as e:
        print(f"Error writing camera JSON file '{output_cameras_json_path}': {e}")
    except TypeError as e:
        print(f"TypeError during camera JSON serialization: {e}.")

def export_points3D_to_json(points3D_data, output_points_json_path):
    """
    Exports 3D points from a COLMAP model to a JSON file.
    The output format is a list of dictionaries, each with "id", "xyz", and "rgb".
    RGB values are normalized to be between 0 and 1.

    Args:
        points3D_data (dict): Dictionary of Point3D objects from read_model.
        output_points_json_path (str): Path to save the output points JSON file.
    """
    if not points3D_data:
        print(f"No 3D points found. Points JSON file will be empty or not created.")
        try:
            with open(output_points_json_path, 'w') as f:
                json.dump([], f, indent=2)
            print(f"Empty JSON array written to: {output_points_json_path}")
        except IOError as e:
            print(f"Error writing empty points JSON file: {e}")
        return

    points_list = []
    for point_id in sorted(points3D_data.keys()):
        point3D_obj = points3D_data[point_id]
        
        xyz_list = point3D_obj.xyz.tolist()
        # Normalize RGB from 0-255 to 0.0-1.0
        rgb_list = (point3D_obj.rgb / 255.0).tolist()

        point_entry = {
            "id": point3D_obj.id, # Already an int
            "xyz": xyz_list,
            "rgb": rgb_list
        }
        points_list.append(point_entry)

    print(f"Processed {len(points_list)} 3D points.")
    print(f"Writing 3D points JSON data to: {output_points_json_path}")
    try:
        with open(output_points_json_path, 'w') as f:
            json.dump(points_list, f, indent=2) # Use indent for readability
        print(f"Successfully exported 3D points data to '{output_points_json_path}'.")
    except IOError as e:
        print(f"Error writing 3D points JSON file '{output_points_json_path}': {e}")
    except TypeError as e:
        print(f"TypeError during 3D points JSON serialization: {e}. This might indicate an issue with data types.")

def process_colmap_model(input_model_path, input_format, output_path):
    """
    Main function that processes a COLMAP model and exports camera poses and 3D points to JSON files.
    
    Args:
        input_model_path (str): Path to the COLMAP model directory.
        input_format (str): Format of the input COLMAP model files ('.bin', '.txt', or '' for auto-detect).
        output_path (str): Base path for output files. Will be used to generate camera and points JSON paths.
    """
    # Ensure output directory exists
    if output_path and not os.path.isdir(output_path):
        try:
            os.makedirs(output_path, exist_ok=True)
            print(f"Created output directory: {output_path}")
        except OSError as e:
            print(f"Error creating output directory '{output_path}': {e}")
            return

    # Auto-generate output file paths
    output_cameras_json_path = os.path.join(output_path, 'cameras.json')
    output_points_json_path = os.path.join(output_path, 'points.json')
    
    print(f"Output cameras JSON path: {output_cameras_json_path}")
    print(f"Output points JSON path: {output_points_json_path}")

    print(f"Attempting to read COLMAP model from: {input_model_path}")
    if input_format:
        print(f"Using specified model format: {input_format}")
    else:
        print("Attempting to auto-detect model format (.bin or .txt).")

    try:
        cameras, images, points3D = read_model(path=input_model_path, ext=input_format)
    except Exception as e:
        print(f"Error reading COLMAP model: {e}")
        print("Please ensure the following:")
        print(f"1. The path '{input_model_path}' is a valid COLMAP model directory.")
        print("2. It contains the necessary files (e.g., images.bin, cameras.bin, points3D.bin or their .txt equivalents).")
        print("3. If you specified input_format, ensure it matches the actual file types.")
        return

    print(f"Successfully read {len(cameras)} camera(s), {len(images)} image(s), and {len(points3D)} 3D point(s) from the model.")

    # Export cameras data
    export_cameras_to_json(cameras, images, output_cameras_json_path)
    
    # Export 3D points data
    export_points3D_to_json(points3D, output_points_json_path)


def main():
    parser = argparse.ArgumentParser(
        description="Convert COLMAP model data (camera poses and 3D points) to JSON file(s)."
    )
    parser.add_argument(
        "input_model_path",
        type=str,
        help="Path to the COLMAP model directory. This directory should contain "
             "the sparse reconstruction files (e.g., cameras.bin, images.bin, points3D.bin "
             "or their .txt counterparts)."
    )
    parser.add_argument(
        "--output_cameras_json_path",
        type=str,
        default="cameras.json", # Default output name for cameras
        help="Path for the output cameras JSON file (e.g., ./cameras.json). Default: cameras.json"
    )
    parser.add_argument(
        "--output_points_json_path",
        type=str,
        default=None, # No default, points are not exported unless specified
        help="Path for the output 3D points JSON file (e.g., ./points.json). "
             "If not provided, 3D points will not be exported."
    )
    parser.add_argument(
        "--input_format",
        choices=[".bin", ".txt", ""], # "" for auto-detect
        default="",
        help="Format of the input COLMAP model files ('.bin' or '.txt'). "
             "If not specified, the script will rely on read_write_model.py's "
             "auto-detection logic. Example: --input_format .bin"
    )

    args = parser.parse_args()

    # Ensure output directory for cameras exists
    output_cameras_dir = os.path.dirname(args.output_cameras_json_path)
    if output_cameras_dir and not os.path.exists(output_cameras_dir):
        try:
            os.makedirs(output_cameras_dir, exist_ok=True)
            print(f"Ensured output directory for cameras exists: {output_cameras_dir}")
        except OSError as e:
            print(f"Error creating output directory '{output_cameras_dir}': {e}")
            return

    # Ensure output directory for points exists if path is provided
    if args.output_points_json_path:
        output_points_dir = os.path.dirname(args.output_points_json_path)
        if output_points_dir and not os.path.exists(output_points_dir):
            try:
                os.makedirs(output_points_dir, exist_ok=True)
                print(f"Ensured output directory for points exists: {output_points_dir}")
            except OSError as e:
                print(f"Error creating output directory '{output_points_dir}': {e}")
                return # Do not proceed if points output dir cannot be made

    print(f"Attempting to read COLMAP model from: {args.input_model_path}")
    if args.input_format:
        print(f"Using specified model format: {args.input_format}")
    else:
        print("Attempting to auto-detect model format (.bin or .txt).")

    try:
        cameras, images, points3D = read_model(path=args.input_model_path, ext=args.input_format)
    except Exception as e:
        print(f"Error reading COLMAP model: {e}")
        print("Please ensure the following:")
        print(f"1. The path '{args.input_model_path}' is a valid COLMAP model directory.")
        print("2. It contains the necessary files (e.g., images.bin, cameras.bin, points3D.bin or their .txt equivalents).")
        print("3. If you specified --input_format, ensure it matches the actual file types.")
        return

    print(f"Successfully read {len(cameras)} camera(s), {len(images)} image(s), and {len(points3D)} 3D point(s) from the model.")

    # Export cameras data
    if args.output_cameras_json_path: # It has a default, so this will always be true unless user inputs empty string (not typical for path args)
        export_cameras_to_json(cameras, images, args.output_cameras_json_path)
    else: # Should not happen with default value set
        print("No output path specified for cameras JSON, skipping camera export.")


    # Export 3D points data if path is provided
    if args.output_points_json_path:
        export_points3D_to_json(points3D, args.output_points_json_path)
    else:
        print("No output path specified for 3D points JSON, skipping points export.")

if __name__ == "__main__":
    main()