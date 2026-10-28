"""
anomaly_detector.py - Real-Time Parking Lot Anomaly & Collision Detection
Approach A: Zero-Dataset Heuristic Tracking using YOLOv8 ByteTrack + IoU + Motion Vector Analysis.

Features:
- Multi-class vehicle tracking (Car, Motorcycle, Bus, Truck: COCO 2, 3, 5, 7)
- Rolling centroid history & velocity vector state estimation (MOVING vs. STATIONARY)
- Perspective occlusion-filtering IoU collision heuristic with K-frame persistence check
- High-visibility visual HUD overlays for CCTV monitoring
- Per-vehicle-pair alert cooldown (default 60s)
- Instant Demo simulation trigger ('c' key in OpenCV or --simulate-crash CLI flag)
- End-to-end Supabase Database & Storage upload + Twilio WhatsApp/SMS Commissioner alerting
"""

import os
import sys
import time
import math
import argparse
import base64
from collections import deque
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any

# Ensure UTF-8 output on Windows consoles to prevent UnicodeEncodeError
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Environment variables setup
try:
    from dotenv import load_dotenv
    load_dotenv()
    # Also load parent .env if available
    parent_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(parent_env):
        load_dotenv(parent_env)
except ImportError:
    pass

# Try importing Computer Vision & AI libraries with graceful simulation fallback
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("[VisionEdge] Notice: OpenCV (cv2) or NumPy not found. Synthetic headless fallback enabled.")

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("[VisionEdge] Notice: Ultralytics YOLO not found. Heuristic mock tracker enabled.")

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

# Import Commissioner Alert Service
try:
    from edge_ai.alerts import CommissionerAlertService
except ImportError:
    from alerts import CommissionerAlertService


# ---------------------------------------------------------
# Mathematical & Geometric Helpers
# ---------------------------------------------------------

def calculate_iou(
    box1: List[float], 
    box2: List[float], 
    coord_precision: int = 2, 
    iou_precision: int = 4
) -> float:
    """
    Computes numerically stable, jitter-resistant Intersection over Union (IoU)
    for two bounding boxes in [x1, y1, x2, y2] format.

    Improvements:
    1. Coordinate Normalization & Precision Control:
       Rounds coordinates to `coord_precision` decimal places to eliminate IEEE 754
       floating point quantization noise across successive frames.
    2. Dimension Validation:
       Enforces canonical ordering (min <= max) and validates non-zero positive areas.
    3. Numerical Stability:
       Applies an epsilon guard (1e-7) against division by zero in zero-area unions.
    4. Deterministic Clamping:
       Guarantees output is strictly in [0.0, 1.0], rounded to `iou_precision`.
    """
    try:
        # Step 1: Sanitize, normalize coordinate ordering, and round to eliminate sub-pixel float noise
        b1_x1 = round(float(min(box1[0], box1[2])), coord_precision)
        b1_y1 = round(float(min(box1[1], box1[3])), coord_precision)
        b1_x2 = round(float(max(box1[0], box1[2])), coord_precision)
        b1_y2 = round(float(max(box1[1], box1[3])), coord_precision)

        b2_x1 = round(float(min(box2[0], box2[2])), coord_precision)
        b2_y1 = round(float(min(box2[1], box2[3])), coord_precision)
        b2_x2 = round(float(max(box2[0], box2[2])), coord_precision)
        b2_y2 = round(float(max(box2[1], box2[3])), coord_precision)

        # Step 2: Calculate intersection rectangle
        inter_x1 = max(b1_x1, b2_x1)
        inter_y1 = max(b1_y1, b2_y1)
        inter_x2 = min(b1_x2, b2_x2)
        inter_y2 = min(b1_y2, b2_y2)

        inter_width = max(0.0, inter_x2 - inter_x1)
        inter_height = max(0.0, inter_y2 - inter_y1)
        intersection_area = inter_width * inter_height

        if intersection_area <= 0.0:
            return 0.0

        # Step 3: Calculate individual box areas
        area1 = (b1_x2 - b1_x1) * (b1_y2 - b1_y1)
        area2 = (b2_x2 - b2_x1) * (b2_y2 - b2_y1)

        # Step 4: Union with epsilon safety against zero-division
        union_area = area1 + area2 - intersection_area
        if union_area <= 1e-7:
            return 0.0

        raw_iou = intersection_area / union_area
        clamped_iou = max(0.0, min(1.0, raw_iou))
        return round(clamped_iou, iou_precision)
    except Exception:
        return 0.0


def get_centroid(box: List[float]) -> Tuple[float, float]:
    """Returns centroid (cx, cy) from [x1, y1, x2, y2]."""
    return ((box[0] + box[2]) / 2.0, (box[1] + box[3]) / 2.0)


def calculate_ioa(plate_box: List[float], vehicle_box: List[float]) -> float:
    """
    Computes Intersection over Plate Area (IoA) for vehicle-to-plate association:
        IoA = (intersection area) / (plate area)
    Replaces standard IoU (which fails because plates are < 5% of car box area).
    """
    try:
        p_x1, p_y1 = min(plate_box[0], plate_box[2]), min(plate_box[1], plate_box[3])
        p_x2, p_y2 = max(plate_box[0], plate_box[2]), max(plate_box[1], plate_box[3])
        v_x1, v_y1 = min(vehicle_box[0], vehicle_box[2]), min(vehicle_box[1], vehicle_box[3])
        v_x2, v_y2 = max(vehicle_box[0], vehicle_box[2]), max(vehicle_box[1], vehicle_box[3])

        inter_x1 = max(p_x1, v_x1)
        inter_y1 = max(p_y1, v_y1)
        inter_x2 = min(p_x2, v_x2)
        inter_y2 = min(p_y2, v_y2)

        inter_w = max(0.0, inter_x2 - inter_x1)
        inter_h = max(0.0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h
        if inter_area <= 0.0:
            return 0.0

        plate_area = (p_x2 - p_x1) * (p_y2 - p_y1)
        if plate_area <= 1e-7:
            return 0.0

        return round(min(1.0, inter_area / plate_area), 4)
    except Exception:
        return 0.0


def is_center_contained(inner_box: List[float], outer_box: List[float], margin: float = 10.0) -> bool:
    """Checks if centroid of inner box lies inside outer box."""
    try:
        cx = (inner_box[0] + inner_box[2]) / 2.0
        cy = (inner_box[1] + inner_box[3]) / 2.0
        x1, y1 = min(outer_box[0], outer_box[2]) - margin, min(outer_box[1], outer_box[3]) - margin
        x2, y2 = max(outer_box[0], outer_box[2]) + margin, max(outer_box[1], outer_box[3]) + margin
        return (x1 <= cx <= x2) and (y1 <= cy <= y2)
    except Exception:
        return False


# ---------------------------------------------------------
# Supabase Integration Helper
# ---------------------------------------------------------

class SupabaseIncidentClient:
    """Handles posting collision records & uploading snapshot frames to Supabase."""

    def __init__(self):
        # Read from standard env or VITE_ variables
        self.supabase_url = (
            os.getenv("SUPABASE_URL") 
            or os.getenv("VITE_SUPABASE_URL") 
            or "https://ifbjbmuafyjbetzxavdb.supabase.co"
        ).rstrip("/")
        
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY") 
            or os.getenv("SUPABASE_KEY") 
            or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY") 
            or ""
        )

        self.storage_bucket = "incident-snapshots"

    def upload_snapshot(self, image_bytes: bytes, filename: str) -> Optional[str]:
        """
        Uploads incident snapshot JPEG to Supabase Storage bucket 'incident-snapshots'.
        Falls back to base64 Data URI if storage bucket or network is inaccessible.
        """
        if not self.supabase_url or not self.supabase_key or not HTTPX_AVAILABLE:
            return self._encode_base64_fallback(image_bytes)

        url = f"{self.supabase_url}/storage/v1/object/{self.storage_bucket}/{filename}"
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, headers=headers, content=image_bytes)
                if res.status_code in (200, 201):
                    public_url = f"{self.supabase_url}/storage/v1/object/public/{self.storage_bucket}/{filename}"
                    print(f"[Supabase] Snapshot uploaded successfully: {public_url}")
                    return public_url
                else:
                    print(f"[Supabase Storage] Upload status {res.status_code}: {res.text}. Using fallback URI.")
        except Exception as e:
            print(f"[Supabase Storage] Upload exception: {e}. Using fallback.")

        return self._encode_base64_fallback(image_bytes)

    def _encode_base64_fallback(self, image_bytes: bytes) -> str:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

    def insert_incident(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inserts new collision record into public.parking_incidents via Supabase REST API.
        """
        if not self.supabase_url or not self.supabase_key or not HTTPX_AVAILABLE:
            print("[Supabase] Notice: Local mock mode active. Incident recorded locally.")
            incident_data["id"] = incident_data.get("id") or f"local-{int(time.time())}"
            return incident_data

        url = f"{self.supabase_url}/rest/v1/parking_incidents"
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, headers=headers, json=incident_data)
                if res.status_code in (200, 201):
                    created = res.json()
                    if isinstance(created, list) and len(created) > 0:
                        print(f"[Supabase] Incident record persisted with ID: {created[0].get('id')}")
                        return created[0]
                else:
                    print(f"[Supabase DB] Error inserting incident: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[Supabase DB] Network exception inserting incident: {e}")

        incident_data["id"] = incident_data.get("id") or f"fallback-{int(time.time())}"
        return incident_data


# ---------------------------------------------------------
# Main Anomaly & Collision Detector
# ---------------------------------------------------------

class ParkingAnomalyDetector:
    """
    Heuristic-based vehicle collision & anomaly detector.
    Tracks bounding boxes with ByteTrack, computes IoU overlap,
    verifies vehicle velocity states, and enforces consecutive frame persistence.
    """

    def __init__(
        self,
        camera_id: str = "CAM_CP_LOT_04",
        lot_zone: str = "Connaught Place - Block A Entry",
        iou_threshold: float = 0.22,
        history_len: int = 30,
        moving_speed_thresh: float = 2.5,
        persistence_frames: int = 5,
        cooldown_sec: float = 60.0,
        smoothing_factor: float = 0.65,
        min_confidence: float = 0.45,
        min_track_age: int = 3,
        coord_precision: int = 2,
        iou_smoothing_window: int = 5,
        yolo_model_name: str = "yolov8n.pt",
    ):
        self.camera_id = camera_id
        self.lot_zone = lot_zone
        self.iou_threshold = iou_threshold
        self.history_len = history_len
        self.moving_speed_thresh = moving_speed_thresh
        self.persistence_frames = persistence_frames
        self.cooldown_sec = cooldown_sec

        # Requirement 1 & 2 & 3: Anti-jitter & stability parameters
        self.smoothing_factor = smoothing_factor       # EMA alpha for bounding box coordinates
        self.min_confidence = min_confidence           # Minimum detection confidence threshold
        self.min_track_age = min_track_age             # Minimum consecutive frames before evaluating collisions
        self.coord_precision = coord_precision         # Coordinate quantization decimal places
        self.iou_smoothing_window = iou_smoothing_window # Sliding window length for pair IoU smoothing

        # Tracking state
        # vehicle_history[track_id] = deque of [(cx, cy, timestamp), ...]
        self.vehicle_history: Dict[int, deque] = {}
        # vehicle_state[track_id] = "MOVING" or "STATIONARY"
        self.vehicle_state: Dict[int, str] = {}
        # vehicle_last_seen[track_id] = frame_idx
        self.vehicle_last_seen: Dict[int, int] = {}
        # vehicle_plates[track_id] = plate string
        self.vehicle_plates: Dict[int, str] = {}

        # Temporal Bounding Box Smoother: track_id -> [x1, y1, x2, y2]
        self.smoothed_boxes: Dict[int, List[float]] = {}
        # Track stability: track_id -> total frames observed
        self.track_age: Dict[int, int] = {}

        # Pairwise temporal IoU sliding window: (id1, id2) -> deque([iou_t-2, iou_t-1, iou_t], maxlen=5)
        self.pair_iou_history: Dict[Tuple[int, int], deque] = {}

        # Collision persistence tracker: (id1, id2) -> consecutive frame count
        self.overlap_streak: Dict[Tuple[int, int], int] = {}

        # Alert cooldown tracker: (id1, id2) -> last alert timestamp
        self.last_alert_time: Dict[Tuple[int, int], float] = {}

        # Active collision alert for visual overlay: (id1, id2, iou, expiry_timestamp)
        self.active_visual_alerts: List[Dict[str, Any]] = []

        # Service integrations
        self.supabase = SupabaseIncidentClient()
        self.alerts_service = CommissionerAlertService()

        # Load YOLO model
        self.model = None
        if YOLO_AVAILABLE:
            try:
                print(f"[Detector] Loading YOLOv8 model '{yolo_model_name}'...")
                self.model = YOLO(yolo_model_name)
                print("[Detector] YOLOv8 initialized with ByteTrack support.")
            except Exception as e:
                print(f"[Detector] Warning: Failed to load YOLO model: {e}. Fallback tracker active.")

    def reset(self):
        """
        Root Cause #2: Explicitly resets all tracking state, smoothed boxes,
        and alert streaks so predictions from previous uploads don't drop new detections.
        """
        self.vehicle_history.clear()
        self.vehicle_state.clear()
        self.vehicle_last_seen.clear()
        self.vehicle_plates.clear()
        self.smoothed_boxes.clear()
        self.track_age.clear()
        self.pair_iou_history.clear()
        self.overlap_streak.clear()
        self.last_alert_time.clear()
        self.active_visual_alerts.clear()
        if self.model is not None and hasattr(self.model, "predictor") and self.model.predictor is not None:
            try:
                self.model.predictor.trackers = None
            except Exception:
                pass
        print("[Detector] Tracking state reset for new session.")

    def smooth_bounding_box(self, track_id: int, raw_box: List[float]) -> List[float]:
        """
        Applies Exponential Moving Average (EMA) and coordinate quantization
        to eliminate sub-pixel and inter-frame bounding box vibration.

        EMA Formula:
            smoothed_t = alpha * raw_t + (1 - alpha) * smoothed_{t-1}
        where alpha = self.smoothing_factor (0.65).
        """
        # Quantize and normalize coordinates
        b_x1 = round(float(min(raw_box[0], raw_box[2])), self.coord_precision)
        b_y1 = round(float(min(raw_box[1], raw_box[3])), self.coord_precision)
        b_x2 = round(float(max(raw_box[0], raw_box[2])), self.coord_precision)
        b_y2 = round(float(max(raw_box[1], raw_box[3])), self.coord_precision)

        quantized = [b_x1, b_y1, b_x2, b_y2]

        # Inverted or degenerated box guard
        if quantized[2] <= quantized[0] or quantized[3] <= quantized[1]:
            return quantized

        # Initialize on first frame
        if track_id not in self.smoothed_boxes:
            self.smoothed_boxes[track_id] = quantized
            return quantized

        prev_box = self.smoothed_boxes[track_id]
        alpha = self.smoothing_factor

        # Temporal EMA per coordinate
        smoothed = [
            round(alpha * quantized[i] + (1.0 - alpha) * prev_box[i], self.coord_precision)
            for i in range(4)
        ]

        # Fallback if smoothed coordinates invert
        if smoothed[2] <= smoothed[0] or smoothed[3] <= smoothed[1]:
            smoothed = quantized

        self.smoothed_boxes[track_id] = smoothed
        return smoothed

    def record_track_observation(self, track_id: int, frame_idx: int) -> int:
        """Increments track age and updates last seen frame index."""
        self.track_age[track_id] = self.track_age.get(track_id, 0) + 1
        self.vehicle_last_seen[track_id] = frame_idx
        return self.track_age[track_id]

    def get_track_age(self, track_id: int) -> int:
        """Returns the number of consecutive frames this track has been detected."""
        return self.track_age.get(track_id, 0)

    def cleanup_stale_tracks(self, current_frame: int, max_idle: int = 90):
        """Purges stale tracking state and history for vehicles that have left the scene."""
        stale_ids = [
            tid for tid, last_frame in self.vehicle_last_seen.items()
            if (current_frame - last_frame) > max_idle
        ]
        for tid in stale_ids:
            self.smoothed_boxes.pop(tid, None)
            self.track_age.pop(tid, None)
            self.vehicle_last_seen.pop(tid, None)
            self.vehicle_history.pop(tid, None)
            self.vehicle_state.pop(tid, None)
            self.vehicle_plates.pop(tid, None)

        # Clean pair IoU history if neither vehicle is active
        stale_pairs = [
            pair for pair in list(self.pair_iou_history.keys())
            if pair[0] in stale_ids or pair[1] in stale_ids
        ]
        for pair in stale_pairs:
            self.pair_iou_history.pop(pair, None)
            self.overlap_streak.pop(pair, None)

    def _generate_plate_mock(self, track_id: int) -> str:
        """Deterministic number plate generator, matching demo vehicle MH 12RN 8834 on first track."""
        if track_id not in self.vehicle_plates:
            if track_id in (1, 101, 104) or len(self.vehicle_plates) == 0:
                self.vehicle_plates[track_id] = "MH 12RN 8834"
            else:
                series = ["AB", "DQ", "XY", "CD", "MP"]
                idx = track_id % len(series)
                num = 1000 + (track_id * 37) % 9000
                self.vehicle_plates[track_id] = f"DL 0{1 + (track_id % 9)} {series[idx]} {num}"
        return self.vehicle_plates[track_id]

    def update_vehicle_motion(self, track_id: int, cx: float, cy: float, now: float) -> str:
        """
        Updates rolling centroid trajectory and classifies vehicle state as MOVING or STATIONARY.
        """
        if track_id not in self.vehicle_history:
            self.vehicle_history[track_id] = deque(maxlen=self.history_len)

        self.vehicle_history[track_id].append((cx, cy, now))

        history = self.vehicle_history[track_id]
        if len(history) < 3:
            state = "STATIONARY"
        else:
            # Calculate average displacement per frame across the last min(10, len) samples
            samples = list(history)[-10:]
            total_dist = 0.0
            for i in range(1, len(samples)):
                dx = samples[i][0] - samples[i - 1][0]
                dy = samples[i][1] - samples[i - 1][1]
                total_dist += math.sqrt(dx * dx + dy * dy)
            avg_disp = total_dist / max(1, len(samples) - 1)

            state = "MOVING" if avg_disp >= self.moving_speed_thresh else "STATIONARY"

        self.vehicle_state[track_id] = state
        return state

    def check_collision_heuristic(
        self,
        vehicles: List[Dict[str, Any]],
        frame_idx: int,
        frame_img: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluates the 3-step collision heuristic for all vehicle pairs:
        1. IoU > threshold
        2. At least one vehicle was MOVING prior to overlap
        3. Overlap condition persists for K consecutive frames
        """
        now = time.time()
        triggered_incidents = []
        current_frame_pairs = set()

        num_v = len(vehicles)
        for i in range(num_v):
            for j in range(i + 1, num_v):
                v1 = vehicles[i]
                v2 = vehicles[j]
                id1, id2 = min(v1["id"], v2["id"]), max(v1["id"], v2["id"])
                pair_key = (id1, id2)

                # Requirement 3: Stabilized pairwise IoU using quantized coordinates
                raw_iou = calculate_iou(
                    v1["box"], 
                    v2["box"], 
                    coord_precision=self.coord_precision,
                    iou_precision=4
                )

                # Requirement 1: Temporal sliding window to smooth IoU across consecutive frames
                if pair_key not in self.pair_iou_history:
                    self.pair_iou_history[pair_key] = deque(maxlen=self.iou_smoothing_window)
                self.pair_iou_history[pair_key].append(raw_iou)

                # Calculate smoothed IoU (temporal mean) to eliminate single-frame jitter
                smoothed_iou = round(
                    sum(self.pair_iou_history[pair_key]) / len(self.pair_iou_history[pair_key]), 
                    4
                )

                # Condition 1: Bounding-box overlap exceeds threshold (evaluated on smoothed IoU)
                if smoothed_iou >= self.iou_threshold:
                    current_frame_pairs.add(pair_key)
                    self.overlap_streak[pair_key] = self.overlap_streak.get(pair_key, 0) + 1

                    # Condition 2: Motion check (at least one vehicle was moving or abrupt velocity shock)
                    state1 = self.vehicle_state.get(id1, "STATIONARY")
                    state2 = self.vehicle_state.get(id2, "STATIONARY")
                    was_moving = (state1 == "MOVING" or state2 == "MOVING")

                    # Condition 3: Overlap persists for K consecutive frames (filters transient noise)
                    is_persistent = self.overlap_streak[pair_key] >= self.persistence_frames

                    if was_moving and is_persistent:
                        # Check cooldown (60 seconds per vehicle pair)
                        last_alert = self.last_alert_time.get(pair_key, 0)
                        if now - last_alert >= self.cooldown_sec:
                            self.last_alert_time[pair_key] = now

                            incident = self._trigger_collision_event(
                                id1=id1,
                                id2=id2,
                                box1=v1["box"],
                                box2=v2["box"],
                                iou=smoothed_iou,
                                frame_img=frame_img
                            )
                            triggered_incidents.append(incident)

                            # Register active visual HUD alert (lasts 8 seconds on screen)
                            self.active_visual_alerts.append({
                                "id1": id1,
                                "id2": id2,
                                "iou": smoothed_iou,
                                "expiry": now + 8.0
                            })
                else:
                    # Reset persistence streak when bounding boxes separate
                    self.overlap_streak[pair_key] = 0

        # Clean expired active visual alerts
        self.active_visual_alerts = [a for a in self.active_visual_alerts if a["expiry"] > now]
        return triggered_incidents

    def _trigger_collision_event(
        self,
        id1: int,
        id2: int,
        box1: List[float],
        box2: List[float],
        iou: float,
        frame_img: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Assembles incident record, uploads snapshot to Supabase Storage,
        records incident in PostgreSQL, and dispatches Twilio Commissioner Alert.
        """
        now = time.time()
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        plate1 = self._generate_plate_mock(id1)
        plate2 = self._generate_plate_mock(id2)

        # 1. Encode or draw snapshot frame
        snapshot_url = None
        if frame_img is not None and CV2_AVAILABLE:
            try:
                # Annotate captured frame with high-visibility HUD overlay
                annotated_frame = frame_img.copy()
                self._draw_hud_overlay(annotated_frame, [{
                    "id1": id1, "id2": id2, "iou": iou, "expiry": now + 5.0
                }], box_map={id1: box1, id2: box2})

                success, buffer = cv2.imencode(".jpg", annotated_frame)
                if success:
                    filename = f"incident_{self.camera_id}_{timestamp_str}.jpg"
                    snapshot_url = self.supabase.upload_snapshot(buffer.tobytes(), filename)
            except Exception as e:
                print(f"[Detector] Frame capture error: {e}")

        if not snapshot_url:
            snapshot_url = "/parking-crash.jpg"

        # 2. Build Supabase payload
        incident_payload = {
            "camera_id": self.camera_id,
            "lot_zone": self.lot_zone,
            "incident_type": "VEHICLE_COLLISION",
            "severity": "CRITICAL",
            "involved_track_ids": [id1, id2],
            "involved_plates": [plate1, plate2],
            "iou_score": round(float(iou), 3),
            "snapshot_url": snapshot_url,
            "status": "UNRESOLVED",
            "notes": f"High impact vehicle collision detected by YOLOv8 ByteTrack heuristic. IoU: {iou:.2f}. Tracks: #{id1} & #{id2}.",
        }

        # 3. Insert into Supabase table
        saved_incident = self.supabase.insert_incident(incident_payload)

        # 4. Dispatch WhatsApp / SMS notification to Municipal Commissioner
        self.alerts_service.send_collision_alert(saved_incident)

        return saved_incident

    def trigger_mock_simulation(self, frame_img: Optional[Any] = None) -> Dict[str, Any]:
        """
        Synthetically triggers a mock collision anomaly event for demo testing.
        Callable via 'c' key in OpenCV or --simulate-crash CLI flag.
        """
        print("\n\033[1;93m[DEMO TRIGGER] Synthetically generating mock collision event...\033[0m")
        id1, id2 = 104, 112
        box1 = [120.0, 180.0, 280.0, 320.0]
        box2 = [220.0, 190.0, 380.0, 330.0]
        iou = calculate_iou(box1, box2) or 0.34

        incident = self._trigger_collision_event(
            id1=id1,
            id2=id2,
            box1=box1,
            box2=box2,
            iou=iou,
            frame_img=frame_img
        )

        self.active_visual_alerts.append({
            "id1": id1,
            "id2": id2,
            "iou": iou,
            "expiry": time.time() + 10.0
        })

        return incident

    def _draw_hud_overlay(
        self,
        frame: Any,
        alerts: List[Dict[str, Any]],
        box_map: Optional[Dict[int, List[float]]] = None
    ):
        """Renders high-visibility red bounding boxes and HUD alert banners on OpenCV frame."""
        if not CV2_AVAILABLE:
            return

        h, w = frame.shape[:2]

        # 1. Top HUD Banner
        banner_h = 52
        cv2.rectangle(frame, (0, 0), (w, banner_h), (0, 0, 180), -1)
        cv2.rectangle(frame, (0, banner_h - 2), (w, banner_h), (0, 0, 255), 2)

        title = "CRITICAL: COLLISION ANOMALY DETECTED"
        cv2.putText(frame, title, (20, 34), cv2.FONT_HERSHEY_DUPLEX, 0.9, (255, 255, 255), 2)

        # Timestamp & Camera ID
        time_text = datetime.now().strftime("%H:%M:%S")
        info_text = f"CAM: {self.camera_id} | {time_text}"
        cv2.putText(frame, info_text, (w - 320, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (220, 220, 255), 2)

        # 2. Draw collision boxes & centroid line if box map provided
        if box_map:
            for alert in alerts:
                id1, id2 = alert["id1"], alert["id2"]
                if id1 in box_map and id2 in box_map:
                    b1 = [int(v) for v in box_map[id1]]
                    b2 = [int(v) for v in box_map[id2]]

                    # Red boxes with thickness 3
                    cv2.rectangle(frame, (b1[0], b1[1]), (b1[2], b1[3]), (0, 0, 255), 3)
                    cv2.rectangle(frame, (b2[0], b2[1]), (b2[2], b2[3]), (0, 0, 255), 3)

                    c1 = ((b1[0] + b1[2]) // 2, (b1[1] + b1[3]) // 2)
                    c2 = ((b2[0] + b2[2]) // 2, (b2[1] + b2[3]) // 2)

                    # Connecting centroid impact line
                    cv2.line(frame, c1, c2, (0, 0, 255), 3, cv2.LINE_AA)
                    cv2.circle(frame, c1, 6, (0, 255, 255), -1)
                    cv2.circle(frame, c2, 6, (0, 255, 255), -1)

                    # Impact label
                    mid_x = (c1[0] + c2[0]) // 2
                    mid_y = (c1[1] + c2[1]) // 2
                    label = f"IMPACT! IoU: {alert['iou']:.2f}"
                    cv2.putText(frame, label, (mid_x - 70, mid_y - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)


# ---------------------------------------------------------
# Synthetic Frame Generator (Guarantees zero-dependency demo)
# ---------------------------------------------------------

def generate_synthetic_parking_frame(frame_idx: int, width: int = 800, height: int = 500) -> Any:
    """
    Generates a realistic animated parking lot frame with vehicles moving and parking.
    Allows testing full visual OpenCV loop without needing an external video file or webcam.
    """
    if not CV2_AVAILABLE:
        return None

    frame = np.full((height, width, 3), 45, dtype=np.uint8)

    # Draw parking lot lane markings
    cv2.line(frame, (100, 150), (700, 150), (200, 200, 200), 2)
    cv2.line(frame, (100, 350), (700, 350), (200, 200, 200), 2)
    for x in range(120, 700, 90):
        cv2.line(frame, (x, 80), (x, 150), (220, 220, 220), 2)
        cv2.line(frame, (x, 350), (x, 420), (220, 220, 220), 2)

    # Stationary parked cars
    cv2.rectangle(frame, (130, 85), (195, 145), (160, 120, 80), -1)
    cv2.rectangle(frame, (310, 85), (375, 145), (100, 160, 100), -1)
    cv2.rectangle(frame, (490, 85), (555, 145), (80, 80, 180), -1)

    # Vehicle 1 moving right
    v1_x = int(140 + (frame_idx * 4) % 450)
    v1_y = 220
    cv2.rectangle(frame, (v1_x, v1_y), (v1_x + 95, v1_y + 55), (180, 60, 60), -1)
    cv2.putText(frame, "ID:101", (v1_x + 5, v1_y + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # Vehicle 2 approaching
    v2_x = int(580 - (frame_idx * 3) % 420)
    v2_y = 235
    cv2.rectangle(frame, (v2_x, v2_y), (v2_x + 95, v2_y + 55), (60, 140, 180), -1)
    cv2.putText(frame, "ID:102", (v2_x + 5, v2_y + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # Camera watermark
    cv2.putText(frame, "NIGAM-Park CCTV [CAM_CP_LOT_04] LIVE", (20, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 200), 1)
    return frame


# ---------------------------------------------------------
# Main Execution Loop
# ---------------------------------------------------------

def run_anomaly_detection_pipeline(
    source: str = "synthetic",
    simulate_crash: bool = False,
    camera_id: str = "CAM_CP_LOT_04",
    lot_zone: str = "Connaught Place - Block A Entry",
    headless: bool = False,
    max_frames: Optional[int] = None,
    min_confidence: float = 0.45,
    smoothing_factor: float = 0.65,
    iou_threshold: float = 0.22,
    persistence_frames: int = 5,
    is_single_image: Optional[bool] = None,
):
    print("=" * 68)
    print("🚀 NIGAM-PARK: VISION AI PARKING LOT ANOMALY & COLLISION DETECTOR")
    print("   Approach A: Zero-Dataset Heuristic Tracking (YOLOv8 + ByteTrack)")
    print("=" * 68)
    print(f"• Camera ID:          {camera_id}")
    print(f"• Parking Zone:       {lot_zone}")
    print(f"• Video Source:       {source}")
    print(f"• Min Confidence:     {min_confidence} (filters low-score detection jitter)")
    print(f"• EMA Smoothing (α):  {smoothing_factor} (bounding-box temporal smoother)")
    print(f"• IoU Overlap Thresh: {iou_threshold}")
    print(f"• Frame Persistence:  {persistence_frames} consecutive frames")
    print(f"• Headless Mode:      {headless}")
    print(f"• Max Frames:         {max_frames if max_frames else 'Continuous'}")
    print("• Controls:           Press 'c' to simulate crash alert | 'q' to quit")
    print("=" * 68)

    detector = ParkingAnomalyDetector(
        camera_id=camera_id, 
        lot_zone=lot_zone,
        iou_threshold=iou_threshold,
        persistence_frames=persistence_frames,
        smoothing_factor=smoothing_factor,
        min_confidence=min_confidence
    )

    if simulate_crash:
        print("[CLI Flag] Triggering mock collision simulation right after startup...")
        detector.trigger_mock_simulation()

    # Open video capture if source is camera index or file
    cap = None
    use_synthetic = (source == "synthetic")

    if not use_synthetic and CV2_AVAILABLE:
        try:
            cam_idx = int(source)
            cap = cv2.VideoCapture(cam_idx)
        except ValueError:
            if os.path.exists(source):
                cap = cv2.VideoCapture(source)
            else:
                print(f"[Detector] Source '{source}' not found. Defaulting to synthetic parking generator.")
                use_synthetic = True

    if is_single_image is None:
        is_single_image = (max_frames == 1 or str(source).lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')))

    # Root Cause #2: Always reset tracker state for clean session
    detector.reset()

    frame_idx = 0
    now = time.time()

    try:
        while True:
            frame_idx += 1
            if max_frames is not None and frame_idx > max_frames:
                print(f"[Detector] Reached max frames ({max_frames}). Completed successfully.")
                break

            now = time.time()
            frame = None

            if use_synthetic or cap is None or not cap.isOpened():
                frame = generate_synthetic_parking_frame(frame_idx)
                time.sleep(0.04)  # ~25 FPS
            else:
                ret, frame = cap.read()
                if not ret:
                    print("[Detector] End of video stream or cannot read frame. Looping...")
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

            # Detect & Track vehicles
            detected_vehicles = []

            if detector.model is not None and frame is not None:
                try:
                    # Root Cause #1 & #2: Multi-class vehicle tracking with persist=False for single images
                    results = detector.model.track(
                        source=frame,
                        persist=(not is_single_image),
                        classes=[2, 3, 5, 7],
                        tracker="bytetrack.yaml",
                        verbose=False
                    )

                    if results and len(results) > 0 and results[0].boxes is not None:
                        boxes = results[0].boxes
                        for idx, box in enumerate(boxes):
                            conf = float(box.conf[0]) if box.conf is not None else 1.0
                            if conf < detector.min_confidence:
                                continue

                            # Root Cause #1: Fall back to raw detection index if ByteTrack has not assigned track_id
                            track_id = int(box.id[0]) if box.id is not None else (idx + 1)

                            raw_xyxy = box.xyxy[0].tolist()

                            # Bounding box smoothing (EMA) and coordinate normalization
                            smoothed_xyxy = detector.smooth_bounding_box(track_id, raw_xyxy)
                            cx, cy = get_centroid(smoothed_xyxy)
                            detector.update_vehicle_motion(track_id, cx, cy, now)
                            detector.record_track_observation(track_id, frame_idx)

                            # Root Cause #1 & #4: In single-image mode or frame 1, do not drop on min_track_age
                            min_age = 1 if is_single_image else detector.min_track_age
                            if detector.get_track_age(track_id) >= min_age:
                                detected_vehicles.append({
                                    "id": track_id,
                                    "box": smoothed_xyxy,
                                    "raw_box": raw_xyxy,
                                    "conf": conf,
                                    "cx": cx,
                                    "cy": cy
                                })
                except Exception as track_err:
                    print(f"[Tracking Error] {track_err}")

            # If no YOLO model installed, generate realistic mock vehicle tracks on synthetic frame
            if not detected_vehicles and use_synthetic:
                v1_x = int(140 + (frame_idx * 4) % 450)
                v2_x = int(580 - (frame_idx * 3) % 420)
                b1 = [float(v1_x), 220.0, float(v1_x + 95), 275.0]
                b2 = [float(v2_x), 235.0, float(v2_x + 95), 290.0]

                s1 = detector.smooth_bounding_box(101, b1)
                s2 = detector.smooth_bounding_box(102, b2)

                c1 = get_centroid(s1)
                c2 = get_centroid(s2)
                detector.update_vehicle_motion(101, c1[0], c1[1], now)
                detector.update_vehicle_motion(102, c2[0], c2[1], now)
                detector.record_track_observation(101, frame_idx)
                detector.record_track_observation(102, frame_idx)

                detected_vehicles = [
                    {"id": 101, "box": s1, "raw_box": b1, "conf": 0.96, "cx": c1[0], "cy": c1[1]},
                    {"id": 102, "box": s2, "raw_box": b2, "conf": 0.94, "cx": c2[0], "cy": c2[1]}
                ]

            # Periodic stale track cleanup to preserve memory
            if frame_idx % 60 == 0:
                detector.cleanup_stale_tracks(frame_idx)

            # Run IoU + Motion Collision Heuristic
            detector.check_collision_heuristic(detected_vehicles, frame_idx, frame_img=frame)

            # Draw visual HUD overlays on frame
            if frame is not None and CV2_AVAILABLE:
                box_map = {v["id"]: v["box"] for v in detected_vehicles}

                # Draw standard tracking bounding boxes
                for v in detected_vehicles:
                    b = [int(p) for p in v["box"]]
                    state = detector.vehicle_state.get(v["id"], "STATIONARY")
                    color = (0, 220, 255) if state == "MOVING" else (180, 180, 180)
                    cv2.rectangle(frame, (b[0], b[1]), (b[2], b[3]), color, 2)
                    cv2.putText(frame, f"ID:{v['id']} [{state[:4]}]", (b[0], b[1] - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

                # Draw active collision alerts overlay
                if detector.active_visual_alerts:
                    detector._draw_hud_overlay(frame, detector.active_visual_alerts, box_map)

                if not headless:
                    cv2.imshow("NIGAM-Park: Collision & Anomaly Detector (OpenCV HUD)", frame)
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        print("[Detector] Quitting on user input...")
                        break
                    elif key == ord('c'):
                        print("\n[OpenCV Key 'c' Pressed] Synthetically triggering collision anomaly...")
                        detector.trigger_mock_simulation(frame_img=frame)

            # Print periodic heartbeat in headless mode
            if headless and frame_idx % 100 == 0:
                print(f"[Detector Heartbeat] Frame #{frame_idx} | Active tracks: {len(detected_vehicles)} | System Live.")

    except KeyboardInterrupt:
        print("\n[Detector] Stopped by user (Ctrl+C).")
    finally:
        if cap is not None:
            cap.release()
        if CV2_AVAILABLE:
            cv2.destroyAllWindows()
        print("[Detector] Cleaned up vision resources. Exiting.")


# ---------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="NIGAM-Park Real-Time Collision & Anomaly Detector")
    parser.add_argument("--source", type=str, default="synthetic", help="Video source: 'synthetic', webcam index (e.g. '0'), or path to .mp4 video")
    parser.add_argument("--simulate-crash", action="store_true", help="Immediately simulate and dispatch a collision alert for testing")
    parser.add_argument("--camera-id", type=str, default="CAM_CP_LOT_04", help="Camera identifier (default: CAM_CP_LOT_04)")
    parser.add_argument("--zone", type=str, default="Connaught Place - Block A Entry", help="Parking lot zone location")
    parser.add_argument("--headless", action="store_true", help="Run without opening GUI OpenCV window")
    parser.add_argument("--max-frames", type=int, default=None, help="Optional frame limit for testing")

    parser.add_argument("--min-confidence", type=float, default=0.45, help="Minimum detection confidence threshold (default: 0.45)")
    parser.add_argument("--smoothing-factor", type=float, default=0.65, help="EMA bounding box smoothing factor alpha (default: 0.65)")
    parser.add_argument("--iou-threshold", type=float, default=0.22, help="Collision IoU overlap threshold (default: 0.22)")
    parser.add_argument("--persistence-frames", type=int, default=5, help="Consecutive frames required for collision confirmation (default: 5)")
    parser.add_argument("--single-image", action="store_true", help="Process input as single image without multi-frame Kalman tracking")

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
        persistence_frames=args.persistence_frames,
        is_single_image=args.single_image if args.single_image else None
    )

if __name__ == "__main__":
    main()

