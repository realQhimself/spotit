# YOLOv11 Model Download Instructions

## Overview
This directory should contain the `yolo11n.tflite` model file for on-device object detection in the SpotIt app.

## Why Automated Download Failed
The automated download failed due to several technical issues:
1. **Hugging Face SSL Issues**: Connection reset errors when accessing `qualcomm/YOLOv11-Detection`
2. **Git LFS Requirements**: Most pre-built TFLite models on GitHub require Git LFS, which is not installed
3. **Licensing Restrictions**: Qualcomm's pre-built model has licensing constraints

## Manual Download Options

### Option 1: Using Ultralytics Python Package (Recommended)
```bash
# Install dependencies
pip3 install ultralytics

# Download and export to TFLite
python3 << EOF
from ultralytics import YOLO

# Load model (auto-downloads yolo11n.pt)
model = YOLO('yolo11n.pt')

# Export to TFLite
model.export(format='tflite', imgsz=640)

# Move to assets/models directory
import os
import shutil
tflite_file = 'yolo11n_saved_model/yolo11n_float32.tflite'
if os.path.exists(tflite_file):
    shutil.move(tflite_file, '/Users/qmacmini/spotit/assets/models/yolo11n.tflite')
    print(f"Model exported successfully: {os.path.getsize('/Users/qmacmini/spotit/assets/models/yolo11n.tflite'):,} bytes")
EOF
```

### Option 2: Using Git LFS
```bash
# Install Git LFS first
# On macOS with Homebrew: brew install git-lfs
# Initialize: git lfs install

# Clone repository with LFS support
cd /tmp
git clone https://github.com/gy6543721/LiteRT.git
cp LiteRT/app/src/main/assets/yolo11n.tflite /Users/qmacmini/spotit/assets/models/
```

### Option 3: Using Colab (No Local Setup Required)
1. Open [Google Colab](https://colab.research.google.com/)
2. Run the following code:
```python
!pip install ultralytics
from ultralytics import YOLO
from google.colab import files

model = YOLO('yolo11n.pt')
model.export(format='tflite', imgsz=640)

# Download the file
files.download('yolo11n_saved_model/yolo11n_float32.tflite')
```
3. Rename the downloaded file to `yolo11n.tflite`
4. Place it in `/Users/qmacmini/spotit/assets/models/`

## Expected Model Specifications
- **Format**: TensorFlow Lite (.tflite)
- **Size**: ~10-11 MB (depending on quantization)
- **Input**: 640x640 RGB image
- **Architecture**: YOLOv11 nano (smallest/fastest variant)

## Verification
After downloading, verify the model file:
```bash
# Check file exists and size
ls -lh /Users/qmacmini/spotit/assets/models/yolo11n.tflite

# Verify it's a valid TFLite model (should show binary data, not HTML)
file /Users/qmacmini/spotit/assets/models/yolo11n.tflite
```

## Alternative Models
If YOLOv11n is unavailable, consider these alternatives:
- **YOLO26n**: Newer model with better efficiency (released Sept 2025)
- **YOLOv8n**: Previous generation, well-supported
- **EfficientDet Lite**: Smaller but less accurate

## References
- [Ultralytics YOLO11 Documentation](https://docs.ultralytics.com/models/yolo11/)
- [YOLOv11-Detection on Qualcomm AI Hub](https://aihub.qualcomm.com/iot/models/yolov11_det)
- [Real-time Object Detection in Android with YOLOv11](https://medium.com/@estebanuri/real-time-object-detection-in-android-with-yolov11-6b7514556185)
- [Ultralytics Assets Releases](https://github.com/ultralytics/assets/releases)
