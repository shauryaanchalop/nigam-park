"""
alerts.py - Commissioner WhatsApp / SMS Notification Service
Integrates Twilio messaging with robust fallback logging for NIGAM-Park.
"""

import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


class CommissionerAlertService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        self.from_number = os.getenv("TWILIO_FROM_NUMBER", "").strip()
        self.commissioner_phone = os.getenv("COMMISSIONER_PHONE_NUMBER", "").strip()
        self.dashboard_base_url = os.getenv("DASHBOARD_BASE_URL", "https://nigam-park.vercel.app").rstrip("/")

        self.client = None
        if TWILIO_AVAILABLE and self.account_sid and self.auth_token:
            try:
                self.client = TwilioClient(self.account_sid, self.auth_token)
            except Exception as e:
                print(f"[AlertService] Warning: Failed to initialize Twilio client: {e}")

    def format_whatsapp_payload(self, incident: Dict[str, Any]) -> str:
        """
        Formats high-priority WhatsApp message payload for the Municipal Commissioner.
        """
        incident_id = incident.get("id", "N/A")
        incident_type = incident.get("incident_type", "VEHICLE_COLLISION").replace("_", " ")
        camera_id = incident.get("camera_id", "CAM_UNKNOWN")
        lot_zone = incident.get("lot_zone", "Unknown Parking Zone")
        iou_score = incident.get("iou_score", 0.0)
        iou_percent = f"{iou_score * 100:.1f}%" if iou_score else "N/A"
        plates = incident.get("involved_plates", [])
        plates_str = ", ".join(plates) if plates else "Involved Vehicles: Track IDs " + str(incident.get("involved_track_ids", []))
        snapshot_url = incident.get("snapshot_url", "https://nigam-park.vercel.app/demo-collision.jpg")
        timestamp_str = datetime.now().strftime("%d %b %Y, %I:%M:%S %p IST")

        deep_link = f"{self.dashboard_base_url}/?camera={camera_id}&incident={incident_id}"

        message = (
            f"🚨 *[NIGAM-PARK CRITICAL ESCALATION]* 🚨\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"⚠️ *Incident:* {incident_type}\n"
            f"📍 *Location:* {lot_zone}\n"
            f"📹 *Camera ID:* `{camera_id}`\n"
            f"🕒 *Detected At:* {timestamp_str}\n"
            f"💥 *Overlap IoU:* {iou_percent}\n"
            f"🚗 *Vehicles:* {plates_str}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🖼️ *Incident Frame:* {snapshot_url}\n"
            f"🔴 *Access Live CCTV Command:*\n"
            f"{deep_link}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Municipal Corporation of Delhi · Vision AI Governance"
        )
        return message

    def send_collision_alert(self, incident: Dict[str, Any]) -> bool:
        """
        Sends WhatsApp or SMS alert to Commissioner.
        Falls back cleanly to terminal display if Twilio credentials are not set.
        """
        message_body = self.format_whatsapp_payload(incident)
        terminal_banner = self._create_terminal_banner(incident, message_body)

        # Always print formatted payload to console for Edge AI operator visibility
        print(terminal_banner)

        if not self.client or not self.from_number or not self.commissioner_phone:
            print("[AlertService] (Mock / Local Mode: Twilio environment variables not configured. Alert logged to terminal).")
            return True

        # Attempt WhatsApp dispatch first
        try:
            from_whatsapp = self.from_number if self.from_number.startswith("whatsapp:") else f"whatsapp:{self.from_number}"
            to_whatsapp = self.commissioner_phone if self.commissioner_phone.startswith("whatsapp:") else f"whatsapp:{self.commissioner_phone}"

            msg = self.client.messages.create(
                from_=from_whatsapp,
                to=to_whatsapp,
                body=message_body
            )
            print(f"[AlertService] WhatsApp alert dispatched successfully! Twilio SID: {msg.sid}")
            return True
        except Exception as wa_error:
            print(f"[AlertService] WhatsApp dispatch error: {wa_error}. Attempting SMS fallback...")

        # Fallback to standard SMS
        try:
            from_sms = self.from_number.replace("whatsapp:", "")
            to_sms = self.commissioner_phone.replace("whatsapp:", "")

            msg = self.client.messages.create(
                from_=from_sms,
                to=to_sms,
                body=message_body
            )
            print(f"[AlertService] SMS fallback alert dispatched! Twilio SID: {msg.sid}")
            return True
        except Exception as sms_error:
            print(f"[AlertService] Twilio SMS failed: {sms_error}")
            return False

    def _create_terminal_banner(self, incident: Dict[str, Any], body: str) -> str:
        border = "=" * 68
        return (
            f"\n\033[91m{border}\033[0m\n"
            f"\033[1;91m🚨 [ALERT DISPATCH] MUNICIPAL COMMISSIONER ESCALATION\033[0m\n"
            f"\033[91m{border}\033[0m\n"
            f"{body}\n"
            f"\033[91m{border}\033[0m\n"
        )
