import { ParkingIncident } from '@/types/incidents';

export const DISMISSED_INCIDENTS_STORAGE_KEY = 'nigam_park_dismissed_incidents';
export const BANNER_SESSION_DISMISSED_KEY = 'nigam_park_banner_session_dismissed';

/**
 * Safely retrieve dismissed incident IDs from sessionStorage
 */
export function getDismissedIncidentIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISSED_INCIDENTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.warn('[IncidentAlert] Failed to read dismissed incidents from sessionStorage:', e);
    return new Set();
  }
}

/**
 * Safely persist a dismissed incident ID into sessionStorage
 */
export function saveDismissedIncidentId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getDismissedIncidentIds();
    set.add(id);
    sessionStorage.setItem(DISMISSED_INCIDENTS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('[IncidentAlert] Failed to save dismissed incident to sessionStorage:', e);
  }
}

/**
 * Check if a specific incident ID has already been dismissed in this session
 */
export function isIncidentDismissed(id: string): boolean {
  if (typeof window === 'undefined' || !id) return false;
  return getDismissedIncidentIds().has(id);
}

/**
 * Persist or clear the session-wide alert banner dismissed state
 */
export function setBannerDismissedForSession(dismissed: boolean = true) {
  if (typeof window === 'undefined') return;
  try {
    if (dismissed) {
      sessionStorage.setItem(BANNER_SESSION_DISMISSED_KEY, 'true');
    } else {
      sessionStorage.removeItem(BANNER_SESSION_DISMISSED_KEY);
    }
  } catch (e) {
    console.warn('[IncidentAlert] Failed to update session banner flag:', e);
  }
}

/**
 * Check if the user has already dismissed the alert banner during the current session
 */
export function isBannerDismissedForSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(BANNER_SESSION_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Synthesizes an emergency alert sound using Web Audio API
 */
export function playEmergencyChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const createTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sawtooth') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    createTone(880, now, 0.18, 'sine');
    createTone(659, now + 0.14, 0.18, 'sine');
    createTone(880, now + 0.32, 0.22, 'triangle');
    createTone(987, now + 0.50, 0.30, 'sine');
  } catch (err) {
    console.warn('Audio synthesis note: user interaction required or context error', err);
  }
}

export const DEFAULT_MOCK_INCIDENTS: ParkingIncident[] = [
  {
    id: 'mock-incident-1',
    camera_id: 'CAM_CP_LOT_04',
    lot_zone: 'Connaught Place - Block A Entry',
    incident_type: 'VEHICLE_COLLISION',
    severity: 'CRITICAL',
    involved_track_ids: [104, 112],
    involved_plates: ['DL 01 AB 1234', 'HR 26 DQ 5678'],
    iou_score: 0.38,
    snapshot_url: '/parking-crash.jpg',
    status: 'UNRESOLVED',
    notes: 'Impact detected between sedan and hatchback near Block A automated entry gate.',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-incident-2',
    camera_id: 'CAM_KB_LOT_02',
    lot_zone: 'Karol Bagh - Zone 3 South',
    incident_type: 'ILLEGAL_STOPPAGE',
    severity: 'HIGH',
    involved_track_ids: [205],
    involved_plates: ['UP 16 CD 7823'],
    iou_score: 0.15,
    snapshot_url: '/parking-crash.png',
    status: 'INVESTIGATING',
    notes: 'Vehicle stationary in emergency fire lane obstructing transit for >15 minutes.',
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
];
