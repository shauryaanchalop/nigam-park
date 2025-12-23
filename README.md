# NIGAM-Park  (https://nigam-park.vercel.app/)
### AI-Powered Revenue Assurance System for Public Parking Governance

NIGAM-Park is an AI-driven civic technology solution designed to eliminate revenue leakage and improve transparency in public parking operations. The system uses Vision AI, real-time payment reconciliation, and centralized monitoring to ensure that every parked vehicle is verified against a legitimate digital payment, without relying on manual enforcement.

Built for the **Hack4Delhi (IEEE NSUT)** hackathon, NIGAM-Park addresses a real and documented governance challenge in municipal parking systems.

---

## Problem Context

Public parking in Delhi and other Indian cities suffers from systemic revenue leakage due to manual fee collection, lack of real-time oversight, and absence of verifiable linkage between vehicles and payments.  

In 2024, a widely circulated public video (commonly referred to as the *“Vinod Kumar UPI incident”*) highlighted the use of personal UPI QR codes for collecting parking fees instead of authorized municipal accounts. While this incident gained attention individually, it exposed a repeatable structural loophole that can scale across hundreds of parking locations when enforcement is manual and opaque.

Additionally, municipal authorities currently lack centralized, real-time visibility into parking occupancy, collections, and violations, making governance reactive rather than proactive.

---

## Solution Overview

NIGAM-Park introduces a **zero-trust parking governance model** based on the principle:

> **Trust data, not people.**

The system continuously validates vehicle entry and exit events using Vision AI and reconciles them against confirmed digital payments in real time. Any mismatch is immediately flagged and escalated to enforcement authorities.

Key capabilities include:
- Automated vehicle detection without manual ticketing  
- Real-time fraud detection for unpaid or mismatched entries  
- Centralized command dashboard for live monitoring  
- Predictive pricing to manage demand, congestion, and environmental impact  

---

## System Architecture

NIGAM-Park follows an **edge-first, low-latency architecture** optimized for civic-scale deployment.

**High-level flow:**
1. CCTV / parking cameras capture vehicle movement  
2. Edge AI processes feeds using YOLOv8 and ALPR  
3. Structured events are sent to a centralized backend  
4. Supabase (PostgreSQL + Realtime) handles reconciliation  
5. Admin dashboard displays live status and analytics  
6. Alerts are sent to zonal officers via messaging APIs  

The design minimizes bandwidth usage, reduces latency, and allows the system to scale from pilot deployments to city-wide rollout.

---

## Technology Stack

- **Programming Language:** Python  
- **Computer Vision:** YOLOv8, OpenCV  
- **Edge Processing:** Local inference on CCTV feeds  
- **Backend & Database:** Supabase (PostgreSQL, Realtime Subscriptions)  
- **Frontend Dashboard:** Lovable.dev (React-based UI)  
- **Alerts & Communication:** WhatsApp / SMS APIs  
- **Payments (Planned / Mocked):** FASTag / UPI / NETC integration  

All components are based on open-source or widely adopted platforms to ensure cost efficiency and scalability for public sector deployment.

---

## Key Features / USP

- **Zero-Trust Enforcement:** No vehicle is considered valid without a system-verified payment record  
- **Vision-Based Monitoring:** Eliminates dependency on manual ticketing and cash handling  
- **Real-Time Fraud Detection:** Immediate alerts for unpaid or anomalous activity  
- **Predictive Pricing Engine:** Dynamic pricing based on demand, congestion, and AQI  
- **Governance-Ready Design:** Built for administrators, not just users  

---

## Impact

- **Revenue:** Projected reduction in leakage with measurable increase in collections  
- **Governance:** Real-time visibility for municipal authorities  
- **Environment:** Reduced cruising time lowers congestion and emissions  
- **Labor Protection:** Removes cash-based exploitation and protects honest attendants  

---

## Current Status

This repository contains the **hackathon MVP / prototype logic**, system design, and demonstration components.  
Some integrations (e.g., FASTag / NETC) are mocked or simulated for pilot demonstration purposes.

---

## Future Roadmap

- Pilot deployment in a controlled parking environment  
- Integration with NETC FASTag APIs  
- Expansion to surface parking lots across the city  
- Advanced analytics and reporting for policy planning  

---

## References & Resources

- Publicly available citizen-recorded parking payment videos (2024)  
- Media reports and RTI discussions on municipal parking revenue leakage  
- YOLOv8, OpenCV, and Supabase official documentation  

---

## License

This project is released for academic, research, and civic innovation purposes.  
Commercial or production deployment requires appropriate authorization from relevant authorities.

---

## Team

Built as part of **Hack4Delhi (IEEE NSUT)**  
Team details available in the project documentation.

