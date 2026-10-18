export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_ALARM';
export type IncidentType = 'VEHICLE_COLLISION' | 'PROPERTY_DAMAGE_ANOMALY' | 'PEDESTRIAN_HAZARD' | 'WRONG_WAY_ENTRY';

export interface ParkingIncident {
  id: string;
  camera_id: string;
  lot_zone: string;
  incident_type: IncidentType | string;
  severity: IncidentSeverity | string;
  involved_track_ids: number[];
  involved_plates: string[];
  iou_score: number | null;
  snapshot_url: string | null;
  status: IncidentStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NewIncidentPayload {
  camera_id: string;
  lot_zone: string;
  incident_type?: string;
  severity?: IncidentSeverity | string;
  involved_track_ids?: number[];
  involved_plates?: string[];
  iou_score?: number;
  snapshot_url?: string;
  status?: IncidentStatus;
  notes?: string;
}
