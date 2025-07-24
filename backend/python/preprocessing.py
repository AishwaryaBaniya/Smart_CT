import SimpleITK as sitk
import nibabel as nib
import numpy as np
from monai.transforms import Compose, LoadImage, EnsureChannelFirst, EnsureType, Orientation, Spacing, Resize, NormalizeIntensity, ToTensor
from pathlib import Path
import config  # Your image size config

def load_dicom_series(dicom_folder):
    """Load DICOM series with SimpleITK."""
    reader = sitk.ImageSeriesReader()
    dicom_files = reader.GetGDCMSeriesFileNames(str(dicom_folder))
    reader.SetFileNames(dicom_files)
    image = reader.Execute()
    return image

def save_compressed_nifti(sitk_image, output_path, compress=True):
    """Save as .nii.gz using NiBabel with proper compression."""
    image_array = sitk.GetArrayFromImage(sitk_image)  # shape (D,H,W)
    affine = np.eye(4)  # Replace with correct affine if needed
    
    # Create NIfTI image and save
    nii = nib.Nifti1Image(image_array, affine)
    
    # Ensure path ends with .nii.gz for compression
    if compress and not str(output_path).endswith('.nii.gz'):
        output_path = str(output_path) + '.nii.gz'
    
    nib.save(nii, str(output_path))  # Compression automatic with .nii.gz suffix

def convert_to_nifti(dicom_folder, output_dir):
    sitk_image = load_dicom_series(dicom_folder)
    if sitk_image.GetSize() == (0, 0, 0):
        return None
    
    # Generate filename
    parts = Path(dicom_folder).parts
    name = f"{parts[-2]}_{parts[-1]}.nii.gz"  # Explicit .nii.gz suffix
    out_path = output_dir / name
    
    save_compressed_nifti(sitk_image, out_path)
    return out_path

def load_and_preprocess_scan(scan_path):
    """
    Load the scan file (NIfTI) and preprocess it to feed into the model.
    Ensures the data is 3D with 1 channel and properly transformed.
    """
    # Load image with nibabel
    img = nib.load(str(scan_path))
    img_array = img.get_fdata()  # numpy array (D, H, W) or (H, W, D) depending on data

    # Ensure data is in (D, H, W) format - if shape is (H, W, D), transpose:
    if img_array.shape[0] < 10 and img_array.shape[-1] > 10:
        # Assuming last dim is slices, move it to first axis
        img_array = np.moveaxis(img_array, -1, 0)

    # Add channel dimension at axis=0 (channel first)
    if img_array.ndim == 3:
        img_array = img_array[np.newaxis, ...]  # shape: (1, D, H, W)
    elif img_array.ndim == 4:
        # If 4D (multiple channels), take first channel only
        img_array = img_array[0:1, ...]  # keep first channel

    # Apply MONAI transforms
    input_tensor = test_transforms(img_array)
    return input_tensor

# Updated transform pipeline for inference - does NOT include LoadImage (you load explicitly above)
test_transforms = Compose([
    EnsureChannelFirst(channel_dim=0),  # already channel first, but safe to keep
    EnsureType(),
    Orientation(axcodes="RAS"),
    Spacing(pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
    Resize(spatial_size=config.IMAGE_SIZE),
    NormalizeIntensity(nonzero=True, channel_wise=True),
    ToTensor()
])

