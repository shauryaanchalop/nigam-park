-- Migration: Parking Incidents & Real-Time Anomaly Tracking
-- Supports Real-Time Parking Lot Anomaly & Collision Detection Feature (Approach A: Heuristic Tracking)

CREATE TABLE IF NOT EXISTS public.parking_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id TEXT NOT NULL,
  lot_zone TEXT NOT NULL,
  incident_type TEXT NOT NULL DEFAULT 'VEHICLE_COLLISION',
  severity TEXT NOT NULL DEFAULT 'CRITICAL',
  involved_track_ids INTEGER[] DEFAULT '{}',
  involved_plates TEXT[] DEFAULT '{}',
  iou_score DOUBLE PRECISION DEFAULT 0.0,
  snapshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'UNRESOLVED' CHECK (status IN ('UNRESOLVED', 'INVESTIGATING', 'RESOLVED', 'FALSE_ALARM')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for rapid lookup by camera, status, and time
CREATE INDEX IF NOT EXISTS idx_parking_incidents_camera_id ON public.parking_incidents(camera_id);
CREATE INDEX IF NOT EXISTS idx_parking_incidents_status ON public.parking_incidents(status);
CREATE INDEX IF NOT EXISTS idx_parking_incidents_created_at ON public.parking_incidents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.parking_incidents ENABLE ROW LEVEL SECURITY;

-- Policies:
-- 1. Anyone (including anonymous dashboard viewers and civic monitors) can view incidents
CREATE POLICY "Public read access for parking incidents"
  ON public.parking_incidents
  FOR SELECT
  USING (true);

-- 2. Allow inserts (from Edge AI pipeline and simulation triggers)
CREATE POLICY "Allow incident inserts"
  ON public.parking_incidents
  FOR INSERT
  WITH CHECK (true);

-- 3. Allow updates (for Commissioner / Attendants acknowledging or marking resolved)
CREATE POLICY "Allow incident updates"
  ON public.parking_incidents
  FOR UPDATE
  USING (true);

-- Enable Realtime for live alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'parking_incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_incidents;
  END IF;
END $$;

-- Storage bucket for incident snapshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-snapshots',
  'incident-snapshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for incident-snapshots bucket
DO $$
BEGIN
  -- Read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for incident snapshots'
  ) THEN
    CREATE POLICY "Public Access for incident snapshots"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'incident-snapshots');
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow upload incident snapshots'
  ) THEN
    CREATE POLICY "Allow upload incident snapshots"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'incident-snapshots');
  END IF;
END $$;

-- Seed demonstration incidents so the commissioner dashboard has instant visual context
INSERT INTO public.parking_incidents (
  camera_id, 
  lot_zone, 
  incident_type, 
  severity, 
  involved_track_ids, 
  involved_plates, 
  iou_score, 
  snapshot_url, 
  status, 
  notes,
  created_at
) VALUES 
(
  'CAM_CP_LOT_04',
  'Connaught Place - Block A Entry',
  'VEHICLE_COLLISION',
  'CRITICAL',
  ARRAY[104, 112],
  ARRAY['DL 01 AB 1234', 'HR 26 DQ 5678'],
  0.34,
  '/parking-crash.jpg',
  'INVESTIGATING',
  'High impact side-swipe detected at entry ramp. Attendant deployed for verification.',
  NOW() - INTERVAL '18 minutes'
),
(
  'CAM_KB_LOT_02',
  'Karol Bagh - Zone 3',
  'PROPERTY_DAMAGE_ANOMALY',
  'HIGH',
  ARRAY[89],
  ARRAY['DL 03 XY 9988'],
  0.26,
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  'UNRESOLVED',
  'Vehicle collided with automated boom barrier arm.',
  NOW() - INTERVAL '4 minutes'
)
ON CONFLICT DO NOTHING;
