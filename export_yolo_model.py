#!/usr/bin/env python3
"""
Export YOLOv11n model to TFLite format for SpotIt app
Run this script after installing ultralytics: pip3 install ultralytics
"""

import os
from pathlib import Path

try:
    from ultralytics import YOLO
    print("✓ Ultralytics imported successfully")

    # Download and load YOLOv11n model
    print("\nDownloading YOLOv11n model...")
    model = YOLO('yolo11n.pt')
    print("✓ Model downloaded")

    # Export to TFLite format
    print("\nExporting to TFLite (this may take a minute)...")
    success = model.export(
        format='tflite',
        imgsz=640,
        int8=False,  # Use FP32 for better accuracy (can change to True for smaller size)
    )
    print(f"✓ Export completed: {success}")

    # Move to assets folder
    tflite_path = Path('yolo11n_saved_model/yolo11n_float32.tflite')
    target_path = Path('/Users/qmacmini/spotit/assets/models/yolo11n.tflite')

    if tflite_path.exists():
        import shutil
        shutil.move(str(tflite_path), str(target_path))
        print(f"\n✓ Model saved to: {target_path}")
        print(f"  Size: {target_path.stat().st_size / 1024 / 1024:.1f} MB")
    else:
        print(f"\n⚠ Could not find exported model at {tflite_path}")
        print("Check the yolo11n_saved_model directory")

except ImportError:
    print("✗ Ultralytics not installed")
    print("\nPlease run: pip3 install ultralytics")
    exit(1)
except Exception as e:
    print(f"\n✗ Error: {e}")
    print("\nIf you see 'No module named tensorflow', install it:")
    print("  pip3 install tensorflow")
    exit(1)
