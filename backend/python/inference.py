import sys
import json
from pathlib import Path

import torch
import nibabel as nib
import numpy as np
import sys

from preprocessing import convert_to_nifti, test_transforms
from model import DenseNet121model


def load_model(model_path):
    print(f"Loading model weights from: {model_path}", file=sys.stderr)

    model = DenseNet121model(in_channels=1, pretrained=False)
    state_dict = torch.load(model_path, map_location=torch.device("cpu"))
    model.load_state_dict(state_dict)
    model.eval()   # <--- THIS is crucial
    print("Model weights loaded successfully.", file=sys.stderr)
    return model


def postprocess_output(outputs):
    """
    Convert raw model outputs (logits) to probabilities and simple labels.
    Outputs is a dict with keys: bowel, extra, liver, kidney, spleen.
    Binary heads -> sigmoid + threshold 0.5 (adjustable)
    Multi-class heads -> softmax + argmax
    """

    results = {}

    # Binary classification: sigmoid + threshold
    for organ in ["bowel", "extra"]:
        logits = outputs[organ].squeeze().detach().cpu()
        prob = torch.sigmoid(logits).item()
        label = 1 if prob >= 0.5 else 0
        results[organ] = {
            "probability": prob,
            "predicted_class": label
        }

    # Multi-class classification: softmax + argmax
    for organ in ["liver", "kidney", "spleen"]:
        logits = outputs[organ].squeeze().detach().cpu()
        probs = torch.softmax(logits, dim=0).numpy()
        label = int(np.argmax(probs))
        results[organ] = {
            "probabilities": probs.tolist(),
            "predicted_class": label
        }

    return results


def run_inference(scan_path, model):
    # Load NIfTI image
    nifti_img = nib.load(str(scan_path))
    img_array = nifti_img.get_fdata()

    # Make sure img_array is (D, H, W)
    if img_array.ndim == 3:
        # Some NIfTI files may be (H, W, D), check and fix
        if img_array.shape[0] < 20 and img_array.shape[-1] > 50:
            img_array = np.moveaxis(img_array, -1, 0)  # move slices to first dim
    elif img_array.ndim == 2:
        # Expand 2D to 3D with depth=1
        img_array = img_array[np.newaxis, :, :]
    else:
        raise ValueError(f"Unsupported image dimension {img_array.shape}")

    # Add channel dim as first axis
    img_array = img_array[np.newaxis, ...]  # shape: (1, D, H, W)

    # Now apply transforms
    input_tensor = test_transforms(img_array)
    input_tensor = input_tensor.unsqueeze(0)  # add batch dim: [1, 1, D, H, W]

    with torch.no_grad():
        outputs = model(input_tensor)

    results = postprocess_output(outputs)

    return results



def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: inference.py <scan_path> <model_path>"}))
        sys.exit(1)

    scan_path = Path(sys.argv[1])
    model_path = Path(sys.argv[2])

    # If DICOM folder, convert to NIfTI
    if scan_path.is_dir():
        scan_path = convert_to_nifti(scan_path, scan_path.parent)
        if scan_path is None:
            print(json.dumps({"error": "Failed to convert DICOM to NIfTI"}))
            sys.exit(1)

    if not scan_path.exists():
        print(json.dumps({"error": f"Scan file {scan_path} does not exist"}))
        sys.exit(1)

    if not model_path.exists():
        print(json.dumps({"error": f"Model file {model_path} does not exist"}))
        sys.exit(1)

    # Load model and run inference
    model = load_model(model_path)
    results = run_inference(scan_path, model)

    # Print results as JSON to stdout
    print(json.dumps(results))


if __name__ == "__main__":
    main()
