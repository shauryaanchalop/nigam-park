#!/usr/bin/env python3
"""
NIGAM-Park: Root Anomaly Detector Launcher
Delegates execution to edge_ai.anomaly_detector.
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add workspace and edge_ai directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "edge_ai"))

from edge_ai.anomaly_detector import run_anomaly_detection_pipeline

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="NIGAM-Park Real-Time Collision & Anomaly Detector")
    parser.add_argument("--source", type=str, default="synthetic", help="Video source: 'synthetic', webcam index ('0'), or video path")
    parser.add_argument("--simulate-crash", action="store_true", help="Immediately simulate and dispatch a collision alert for testing")
    parser.add_argument("--camera-id", type=str, default="CAM_CP_LOT_04", help="Camera identifier")
    parser.add_argument("--zone", type=str, default="Connaught Place - Block A Entry", help="Parking lot zone location")
    parser.add_argument("--headless", action="store_true", help="Run without opening GUI OpenCV window")
    parser.add_argument("--max-frames", type=int, default=None, help="Optional frame limit for testing")
    parser.add_argument("--min-confidence", type=float, default=0.45, help="Minimum detection confidence threshold (default: 0.45)")
    parser.add_argument("--smoothing-factor", type=float, default=0.65, help="EMA bounding box smoothing factor alpha (default: 0.65)")
    parser.add_argument("--iou-threshold", type=float, default=0.22, help="Collision IoU overlap threshold (default: 0.22)")
    parser.add_argument("--persistence-frames", type=int, default=5, help="Consecutive frames required for collision confirmation (default: 5)")

    args = parser.parse_args()

    run_anomaly_detection_pipeline(
        source=args.source,
        simulate_crash=args.simulate_crash,
        camera_id=args.camera_id,
        lot_zone=args.zone,
        headless=args.headless,
        max_frames=args.max_frames,
        min_confidence=args.min_confidence,
        smoothing_factor=args.smoothing_factor,
        iou_threshold=args.iou_threshold,
        persistence_frames=args.persistence_frames
    )
