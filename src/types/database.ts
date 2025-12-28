export type AppRole = 'admin' | 'attendant' | 'citizen';

export interface ParkingLot {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  current_occupancy: number;
  lat: number;
  lng: number;
  hourly_rate: number;
  status: string;
  created_at: string;
  has_ev_charging?: boolean | null;
  has_covered_parking?: boolean | null;
  near_metro?: boolean | null;
  metro_station?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
}

export interface Transaction {
  id: string;
  lot_id: string;
  vehicle_number: string;
  amount: number;
  payment_method: 'FASTag' | 'Cash' | 'UPI' | 'Overstay Fee';
  status: 'pending' | 'completed' | 'failed';
  entry_time: string;
  exit_time: string | null;
  created_at: string;
}

export interface SensorLog {
  id: string;
  lot_id: string;
  event_type: 'entry' | 'exit';
  vehicle_detected: string | null;
  has_payment: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  lot_id: string | null;
  alert_type: 'fraud' | 'capacity' | 'maintenance';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  sensor_log_id: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_lot_id: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Joined types
export interface AlertWithLot extends Alert {
  parking_lots?: ParkingLot;
}

export interface TransactionWithLot extends Transaction {
  parking_lots?: ParkingLot;
}
