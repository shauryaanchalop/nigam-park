// AI Module Types

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED';
export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'OCCLUDED';

export interface FraudAlert {
  id: string;
  created_at: string;
  severity: FraudSeverity;
  location: string;
  description: string;
  status: FraudStatus;
  metadata: Record<string, unknown>;
}

export interface Camera {
  id: string;
  name: string;
  zone: string;
  status: CameraStatus;
  stream_url: string | null;
  created_at: string;
}

export interface VisionEvent {
  id: string;
  camera_id: string;
  detected_at: string;
  object_type: string;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OccupancyForecast {
  id: string;
  parking_lot_id: string;
  forecast_time: string;
  predicted_occupancy: number;
  confidence_score: number;
  created_at: string;
}

export interface CameraWithEvents extends Camera {
  vision_events?: VisionEvent[];
}
