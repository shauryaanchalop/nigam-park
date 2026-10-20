/**
 * Demo fallbacks — used only when a signed-in user has no records of their own,
 * so every screen in the prototype shows realistic content instead of an empty state.
 */

export const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
export const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
export const futureDateStr = (d: number) => new Date(Date.now() + d * 86400000).toISOString().split('T')[0];

export const DEMO_WALLET_LEDGER = [
  { id: 'demo-wt-1', wallet_id: 'demo', user_id: 'demo', amount: 2000, transaction_type: 'topup' as const, description: 'Wallet top-up via UPI', reference_id: null, balance_after: 2000, created_at: daysAgo(12) },
  { id: 'demo-wt-2', wallet_id: 'demo', user_id: 'demo', amount: 250, transaction_type: 'debit' as const, description: 'Parking at Chandni Chowk Metro', reference_id: null, balance_after: 1750, created_at: daysAgo(9) },
  { id: 'demo-wt-3', wallet_id: 'demo', user_id: 'demo', amount: 100, transaction_type: 'bonus' as const, description: 'Loyalty cashback reward', reference_id: null, balance_after: 1850, created_at: daysAgo(7) },
  { id: 'demo-wt-4', wallet_id: 'demo', user_id: 'demo', amount: 200, transaction_type: 'debit' as const, description: 'Parking at Connaught Place Block A', reference_id: null, balance_after: 1650, created_at: daysAgo(5) },
  { id: 'demo-wt-5', wallet_id: 'demo', user_id: 'demo', amount: 300, transaction_type: 'debit' as const, description: 'Monthly pass renewal', reference_id: null, balance_after: 1350, created_at: daysAgo(3) },
  { id: 'demo-wt-6', wallet_id: 'demo', user_id: 'demo', amount: 100, transaction_type: 'refund' as const, description: 'Refund for cancelled booking', reference_id: null, balance_after: 1450, created_at: daysAgo(1) },
];

export const DEMO_LOYALTY_TRANSACTIONS = [
  { id: 'demo-lt-1', account_id: 'demo', points: 200, transaction_type: 'earned', description: 'Points for parking at Nehru Place IT Hub', reference_id: null, created_at: daysAgo(14) },
  { id: 'demo-lt-2', account_id: 'demo', points: 150, transaction_type: 'earned', description: 'Points for parking at Karol Bagh Market', reference_id: null, created_at: daysAgo(10) },
  { id: 'demo-lt-3', account_id: 'demo', points: -100, transaction_type: 'redeemed', description: 'Redeemed for ₹50 parking discount', reference_id: null, created_at: daysAgo(7) },
  { id: 'demo-lt-4', account_id: 'demo', points: 300, transaction_type: 'earned', description: 'Referral bonus', reference_id: null, created_at: daysAgo(4) },
  { id: 'demo-lt-5', account_id: 'demo', points: 120, transaction_type: 'earned', description: 'Points for monthly pass purchase', reference_id: null, created_at: daysAgo(2) },
];

export const DEMO_FLEET_VEHICLES = [
  { id: 'demo-fv-1', business_account_id: 'demo', vehicle_number: 'DL01LG1122', vehicle_type: 'car', driver_name: 'Ramesh Kumar', driver_phone: '+91 98110 11223', department: 'Sales', is_active: true, monthly_limit: 5000, current_month_usage: 2340, created_at: daysAgo(30), updated_at: daysAgo(1) },
  { id: 'demo-fv-2', business_account_id: 'demo', vehicle_number: 'DL02LG3344', vehicle_type: 'van', driver_name: 'Suresh Yadav', driver_phone: '+91 98110 33445', department: 'Logistics', is_active: true, monthly_limit: 8000, current_month_usage: 6120, created_at: daysAgo(28), updated_at: daysAgo(1) },
  { id: 'demo-fv-3', business_account_id: 'demo', vehicle_number: 'DL03LG5566', vehicle_type: 'car', driver_name: 'Anita Verma', driver_phone: '+91 98110 55667', department: 'Operations', is_active: true, monthly_limit: 5000, current_month_usage: 1180, created_at: daysAgo(20), updated_at: daysAgo(1) },
  { id: 'demo-fv-4', business_account_id: 'demo', vehicle_number: 'DL04LG7788', vehicle_type: 'truck', driver_name: 'Vikas Singh', driver_phone: '+91 98110 77889', department: 'Distribution', is_active: true, monthly_limit: 12000, current_month_usage: 9450, created_at: daysAgo(15), updated_at: daysAgo(1) },
];

export interface DemoViolationReport {
  id: string;
  reporter_id: string;
  lot_id: string | null;
  vehicle_number: string;
  violation_type: string;
  description: string | null;
  photo_url: string | null;
  location: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  parking_lots?: {
    name: string;
    zone: string;
  };
  profiles?: {
    full_name: string | null;
  };
}

export const DEMO_VIOLATION_REPORTS: DemoViolationReport[] = [
  {
    id: 'demo-vr-1',
    reporter_id: 'citizen-demo-1',
    lot_id: 'cp-block-a',
    vehicle_number: 'DL01AB1234',
    violation_type: 'blocking_entrance',
    description: 'Vehicle parked directly in front of the entry barrier gate, preventing other vehicles from entering Block A.',
    photo_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=60',
    location: 'Connaught Place Block A - Main Gate',
    status: 'pending',
    admin_notes: null,
    created_at: daysAgo(0.1),
    resolved_at: null,
    parking_lots: {
      name: 'Connaught Place Block A',
      zone: 'New Delhi',
    },
    profiles: {
      full_name: 'Rajesh Sharma',
    },
  },
  {
    id: 'demo-vr-2',
    reporter_id: 'citizen-demo-2',
    lot_id: 'kb-market',
    vehicle_number: 'HR26DK4589',
    violation_type: 'handicap_violation',
    description: 'Parked in designated Divyang/accessible parking spot without any disability permit sticker or badge.',
    photo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=60',
    location: 'Karol Bagh Market - Slot D-01',
    status: 'reviewing',
    admin_notes: 'CCTV footage requested from attendant on duty at Karol Bagh.',
    created_at: daysAgo(0.4),
    resolved_at: null,
    parking_lots: {
      name: 'Karol Bagh Market',
      zone: 'Central Delhi',
    },
    profiles: {
      full_name: 'Priya Mehra',
    },
  },
  {
    id: 'demo-vr-3',
    reporter_id: 'citizen-demo-3',
    lot_id: 'cc-metro',
    vehicle_number: 'UP16CD7823',
    violation_type: 'double_parking',
    description: 'Double parked alongside slot 14, trapping another sedan for over 45 minutes.',
    photo_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=60',
    location: 'Chandni Chowk Metro Parking',
    status: 'action_taken',
    admin_notes: 'Traffic marshal dispatched. E-challan fine of ₹500 issued and vehicle moved to holding bay.',
    created_at: daysAgo(1.2),
    resolved_at: daysAgo(1.1),
    parking_lots: {
      name: 'Chandni Chowk Metro',
      zone: 'Old Delhi',
    },
    profiles: {
      full_name: 'Amit Verma',
    },
  },
  {
    id: 'demo-vr-4',
    reporter_id: 'citizen-demo-4',
    lot_id: 'ln-central',
    vehicle_number: 'DL08EF9012',
    violation_type: 'overstay',
    description: 'Vehicle exceeded 2-hour prepaid booking duration by more than 3 hours with unpaid overstay balance.',
    photo_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=60',
    location: 'Lajpat Nagar Central Market - Level 2',
    status: 'resolved',
    admin_notes: 'Owner settled pending overstay fee of ₹120 at the automated exit barrier.',
    created_at: daysAgo(2),
    resolved_at: daysAgo(1.8),
    parking_lots: {
      name: 'Lajpat Nagar Central Market',
      zone: 'South Delhi',
    },
    profiles: {
      full_name: 'Sunita Rao',
    },
  },
  {
    id: 'demo-vr-5',
    reporter_id: 'citizen-demo-5',
    lot_id: 'np-it',
    vehicle_number: 'DL03GH3456',
    violation_type: 'illegal_parking',
    description: 'Parked in pedestrian emergency evacuation walkway clearly marked with red chevron stripes.',
    photo_url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=60',
    location: 'Nehru Place IT Hub - Pedestrian Plaza',
    status: 'pending',
    admin_notes: null,
    created_at: daysAgo(0.3),
    resolved_at: null,
    parking_lots: {
      name: 'Nehru Place IT Hub',
      zone: 'South-East Delhi',
    },
    profiles: {
      full_name: 'Vikas Malhotra',
    },
  },
  {
    id: 'demo-vr-6',
    reporter_id: 'citizen-demo-6',
    lot_id: 'cp-block-a',
    vehicle_number: 'DL04JK5678',
    violation_type: 'no_payment',
    description: 'Vehicle attempted tailgating exit without scanning QR or paying parking toll fee.',
    photo_url: null,
    location: 'Connaught Place Block A - Exit 2',
    status: 'action_taken',
    admin_notes: 'ANPR camera flagged vehicle. Automated notice generated and added to municipal collection database.',
    created_at: daysAgo(3),
    resolved_at: daysAgo(2.9),
    parking_lots: {
      name: 'Connaught Place Block A',
      zone: 'New Delhi',
    },
    profiles: {
      full_name: 'Karan Saxena',
    },
  },
  {
    id: 'demo-vr-7',
    reporter_id: 'citizen-demo-7',
    lot_id: 'kb-market',
    vehicle_number: 'HR55MN7890',
    violation_type: 'other',
    description: 'Complaint regarding delivery van refusing to clear reserved municipal loading bay.',
    photo_url: null,
    location: 'Karol Bagh Market - Loading Dock B',
    status: 'rejected',
    admin_notes: 'Driver was verified to be a registered delivery partner actively unloading municipal equipment with valid temporary pass.',
    created_at: daysAgo(4),
    resolved_at: daysAgo(3.9),
    parking_lots: {
      name: 'Karol Bagh Market',
      zone: 'Central Delhi',
    },
    profiles: {
      full_name: 'Gaurav Gupta',
    },
  },
];

import { ParkingLot } from '@/types/database';

export const DEMO_PARKING_LOTS: ParkingLot[] = [
  {
    id: 'cp-block-a',
    name: 'Connaught Place Block A',
    zone: 'New Delhi',
    capacity: 200,
    current_occupancy: 156,
    lat: 28.6315,
    lng: 77.2167,
    hourly_rate: 40,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    has_ev_charging: true,
    has_covered_parking: true,
    near_metro: true,
    metro_station: 'Rajiv Chowk',
    average_rating: 4.6,
    review_count: 142,
  },
  {
    id: 'kb-market',
    name: 'Karol Bagh Market',
    zone: 'Central Delhi',
    capacity: 150,
    current_occupancy: 87,
    lat: 28.6519,
    lng: 77.1905,
    hourly_rate: 30,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    has_ev_charging: false,
    has_covered_parking: true,
    near_metro: true,
    metro_station: 'Karol Bagh',
    average_rating: 4.2,
    review_count: 98,
  },
  {
    id: 'ln-central',
    name: 'Lajpat Nagar Central',
    zone: 'South Delhi',
    capacity: 120,
    current_occupancy: 45,
    lat: 28.5700,
    lng: 77.2400,
    hourly_rate: 25,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    has_ev_charging: true,
    has_covered_parking: false,
    near_metro: true,
    metro_station: 'Lajpat Nagar',
    average_rating: 4.4,
    review_count: 67,
  },
  {
    id: 'cc-metro',
    name: 'Chandni Chowk Metro',
    zone: 'Old Delhi',
    capacity: 80,
    current_occupancy: 72,
    lat: 28.6562,
    lng: 77.2300,
    hourly_rate: 20,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    has_ev_charging: false,
    has_covered_parking: false,
    near_metro: true,
    metro_station: 'Chandni Chowk',
    average_rating: 4.1,
    review_count: 110,
  },
  {
    id: 'np-it',
    name: 'Nehru Place IT Hub',
    zone: 'South-East Delhi',
    capacity: 180,
    current_occupancy: 98,
    lat: 28.5494,
    lng: 77.2519,
    hourly_rate: 35,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    has_ev_charging: true,
    has_covered_parking: true,
    near_metro: true,
    metro_station: 'Nehru Place',
    average_rating: 4.5,
    review_count: 85,
  },
  {
    id: 'sn-market',
    name: 'Sarojini Nagar Market',
    zone: 'South-West Delhi',
    capacity: 100,
    current_occupancy: 89,
    lat: 28.5775,
    lng: 77.1992,
    hourly_rate: 25,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    has_ev_charging: false,
    has_covered_parking: false,
    near_metro: true,
    metro_station: 'Sarojini Nagar',
    average_rating: 4.3,
    review_count: 124,
  },
];

import { CameraWithEvents, FraudAlert } from '@/types/ai-modules';

export const DEMO_CAMERAS: CameraWithEvents[] = [
  {
    id: 'CAM-DEL-01',
    name: 'CP Block A - Main Entry & ANPR',
    zone: 'Connaught Place - Block A Entry',
    status: 'ONLINE',
    stream_url: '/parking-crash.jpg',
    created_at: daysAgo(30),
    vision_events: [
      { id: 'ev-1', camera_id: 'CAM-DEL-01', detected_at: daysAgo(0.01), object_type: 'Sedan (Collision)', bounding_box: { x: 22, y: 38, width: 30, height: 32 } },
      { id: 'ev-2', camera_id: 'CAM-DEL-01', detected_at: daysAgo(0.01), object_type: 'Hatchback (DL01AB1234)', bounding_box: { x: 50, y: 40, width: 28, height: 30 } },
      { id: 'ev-3', camera_id: 'CAM-DEL-01', detected_at: daysAgo(0.05), object_type: 'Number Plate (DL01AB1234)', bounding_box: { x: 55, y: 62, width: 14, height: 8 } },
    ],
  },
  {
    id: 'CAM-DEL-02',
    name: 'CP Block B - Underground Ramp Bay 4',
    zone: 'Connaught Place - Block B Underground',
    status: 'ONLINE',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(30),
    vision_events: [
      { id: 'ev-4', camera_id: 'CAM-DEL-02', detected_at: daysAgo(0.02), object_type: 'Car (HR26DK4589)', bounding_box: { x: 15, y: 30, width: 35, height: 40 } },
      { id: 'ev-5', camera_id: 'CAM-DEL-02', detected_at: daysAgo(0.03), object_type: 'SUV (UP16CD7823)', bounding_box: { x: 58, y: 35, width: 32, height: 38 } },
    ],
  },
  {
    id: 'CAM-DEL-03',
    name: 'Karol Bagh Market - Main Gate ANPR',
    zone: 'Karol Bagh Market - Entry Gate 1',
    status: 'ONLINE',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(30),
    vision_events: [
      { id: 'ev-6', camera_id: 'CAM-DEL-03', detected_at: daysAgo(0.01), object_type: 'Motorcycle', bounding_box: { x: 10, y: 45, width: 20, height: 35 } },
      { id: 'ev-7', camera_id: 'CAM-DEL-03', detected_at: daysAgo(0.02), object_type: 'Sedan (DL08EF9012)', bounding_box: { x: 42, y: 28, width: 40, height: 45 } },
    ],
  },
  {
    id: 'CAM-DEL-04',
    name: 'Karol Bagh - Multi-Level Automated Bay',
    zone: 'Karol Bagh - Slot D-01',
    status: 'ONLINE',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(25),
    vision_events: [
      { id: 'ev-8', camera_id: 'CAM-DEL-04', detected_at: daysAgo(0.04), object_type: 'Car (DL03GH3456)', bounding_box: { x: 25, y: 35, width: 38, height: 35 } },
    ],
  },
  {
    id: 'CAM-DEL-05',
    name: 'Nehru Place - IT Tower South Gate',
    zone: 'Nehru Place IT Hub - Pedestrian Plaza',
    status: 'ONLINE',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(20),
    vision_events: [
      { id: 'ev-9', camera_id: 'CAM-DEL-05', detected_at: daysAgo(0.02), object_type: 'EV Charger Spot [Occupied]', bounding_box: { x: 30, y: 30, width: 45, height: 40 } },
    ],
  },
  {
    id: 'CAM-DEL-06',
    name: 'Chandni Chowk - Metro Gate 3 ANPR',
    zone: 'Chandni Chowk Metro Parking',
    status: 'OCCLUDED',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(15),
    vision_events: [
      { id: 'ev-10', camera_id: 'CAM-DEL-06', detected_at: daysAgo(0.08), object_type: 'Delivery Van', bounding_box: { x: 18, y: 32, width: 48, height: 45 } },
    ],
  },
  {
    id: 'CAM-DEL-07',
    name: 'Lajpat Nagar - Central Ring ANPR',
    zone: 'Lajpat Nagar Central Market - Level 2',
    status: 'ONLINE',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(12),
    vision_events: [
      { id: 'ev-11', camera_id: 'CAM-DEL-07', detected_at: daysAgo(0.01), object_type: 'Sedan (DL04JK5678)', bounding_box: { x: 20, y: 25, width: 42, height: 45 } },
    ],
  },
  {
    id: 'CAM-DEL-08',
    name: 'Sarojini Nagar - Entry Boom Barrier',
    zone: 'Sarojini Nagar Market - West Gate',
    status: 'OFFLINE',
    stream_url: '/cctv-parking.jpg',
    created_at: daysAgo(10),
    vision_events: [],
  },
];

export const DEMO_RESERVATIONS = (() => {
  const lots = [
    { id: 'cp-block-a', name: 'Connaught Place Block A', zone: 'New Delhi', rate: 40 },
    { id: 'kb-market', name: 'Karol Bagh Market', zone: 'Central Delhi', rate: 30 },
    { id: 'np-it', name: 'Nehru Place IT Hub', zone: 'South-East Delhi', rate: 35 },
    { id: 'cc-metro', name: 'Chandni Chowk Metro', zone: 'Old Delhi', rate: 20 },
    { id: 'ln-central', name: 'Lajpat Nagar Central', zone: 'South Delhi', rate: 25 },
    { id: 'sn-market', name: 'Sarojini Nagar Market', zone: 'South-West Delhi', rate: 25 },
    { id: 'hk-village', name: 'Hauz Khas Village', zone: 'South Delhi', rate: 50 },
    { id: 'aero-hub', name: 'Aerocity Express Terminal', zone: 'IGI Airport Zone', rate: 60 },
  ];

  const vehicles = ['DL01AB1234', 'DL03CD5678', 'DL08EF9012', 'DL04GH3456'];
  const timeSlots = [
    { start: '09:00:00', end: '13:00:00', hours: 4 },
    { start: '10:00:00', end: '14:00:00', hours: 4 },
    { start: '11:00:00', end: '15:00:00', hours: 4 },
    { start: '13:00:00', end: '17:00:00', hours: 4 },
    { start: '14:00:00', end: '18:00:00', hours: 4 },
    { start: '16:00:00', end: '20:00:00', hours: 4 },
    { start: '18:00:00', end: '22:00:00', hours: 4 },
  ];

  const list: Array<{
    id: string;
    user_id: string;
    lot_id: string;
    vehicle_number: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    amount: number;
    status: string;
    created_at: string;
    checked_in_at?: string;
    parking_lots: {
      name: string;
      zone: string;
    };
  }> = [];

  // Today (day 0) active reservations
  list.push(
    {
      id: 'res-demo-today-1',
      user_id: 'demo',
      lot_id: 'cp-block-a',
      vehicle_number: 'DL01AB1234',
      reservation_date: futureDateStr(0),
      start_time: '14:00:00',
      end_time: '18:00:00',
      amount: 160,
      status: 'confirmed',
      created_at: daysAgo(0.1),
      parking_lots: { name: 'Connaught Place Block A', zone: 'New Delhi' },
    },
    {
      id: 'res-demo-today-2',
      user_id: 'demo',
      lot_id: 'cc-metro',
      vehicle_number: 'DL01AB1234',
      reservation_date: futureDateStr(0),
      start_time: '10:00:00',
      end_time: '13:00:00',
      amount: 60,
      status: 'checked_in',
      created_at: daysAgo(0.05),
      checked_in_at: daysAgo(0.05),
      parking_lots: { name: 'Chandni Chowk Metro', zone: 'Old Delhi' },
    }
  );

  // Every single day from day 1 to day 90 in the future
  for (let d = 1; d <= 90; d++) {
    const lot1 = lots[d % lots.length];
    const lot2 = lots[(d + 3) % lots.length];
    const slot1 = timeSlots[d % timeSlots.length];
    const slot2 = timeSlots[(d + 2) % timeSlots.length];
    const veh1 = vehicles[d % vehicles.length];
    const veh2 = vehicles[(d + 1) % vehicles.length];

    list.push({
      id: `res-demo-future-${d}-a`,
      user_id: 'demo',
      lot_id: lot1.id,
      vehicle_number: veh1,
      reservation_date: futureDateStr(d),
      start_time: slot1.start,
      end_time: slot1.end,
      amount: slot1.hours * lot1.rate,
      status: 'confirmed',
      created_at: daysAgo(Math.max(0.05, 0.5 - d * 0.005)),
      parking_lots: {
        name: lot1.name,
        zone: lot1.zone,
      },
    });

    // Add second reservation every 2nd day
    if (d % 2 === 0) {
      list.push({
        id: `res-demo-future-${d}-b`,
        user_id: 'demo',
        lot_id: lot2.id,
        vehicle_number: veh2,
        reservation_date: futureDateStr(d),
        start_time: slot2.start,
        end_time: slot2.end,
        amount: slot2.hours * lot2.rate,
        status: 'confirmed',
        created_at: daysAgo(Math.max(0.05, 0.6 - d * 0.005)),
        parking_lots: {
          name: lot2.name,
          zone: lot2.zone,
        },
      });
    }
  }

  // Past reservations (past 30 days)
  for (let p = 1; p <= 30; p += 2) {
    const lot = lots[p % lots.length];
    const slot = timeSlots[p % timeSlots.length];
    list.push({
      id: `res-demo-past-${p}`,
      user_id: 'demo',
      lot_id: lot.id,
      vehicle_number: 'DL01AB1234',
      reservation_date: daysAgo(p).split('T')[0],
      start_time: slot.start,
      end_time: slot.end,
      amount: slot.hours * lot.rate,
      status: p === 5 ? 'cancelled' : 'completed',
      created_at: daysAgo(p + 0.5),
      checked_in_at: p === 5 ? undefined : daysAgo(p + 0.1),
      parking_lots: {
        name: lot.name,
        zone: lot.zone,
      },
    });
  }

  return list;
})();

export const DEMO_FINES = [
  {
    id: 'fine-demo-1',
    user_id: 'demo',
    reservation_id: 'res-demo-1',
    amount: 250,
    reason: 'Overstaying beyond prepaid reservation duration (>45 min)',
    status: 'pending',
    applied_to_transaction_id: null,
    created_at: daysAgo(0.5),
    resolved_at: null,
    profiles: { full_name: 'Rajesh Sharma' },
    reservations: {
      vehicle_number: 'DL01AB1234',
      parking_lots: { name: 'Connaught Place Block A' },
    },
  },
  {
    id: 'fine-demo-2',
    user_id: 'demo-u2',
    reservation_id: null,
    amount: 500,
    reason: 'Parking in designated Divyang/accessible spot without valid MCD permit',
    status: 'pending',
    applied_to_transaction_id: null,
    created_at: daysAgo(1.5),
    resolved_at: null,
    profiles: { full_name: 'Vikram Malhotra' },
    reservations: {
      vehicle_number: 'HR26DK4589',
      parking_lots: { name: 'Karol Bagh Market' },
    },
  },
  {
    id: 'fine-demo-3',
    user_id: 'demo-u3',
    reservation_id: null,
    amount: 200,
    reason: 'Obstruction of emergency evacuation lane / barrier driveway',
    status: 'resolved',
    applied_to_transaction_id: 'tx-fine-3',
    created_at: daysAgo(3),
    resolved_at: daysAgo(2.8),
    profiles: { full_name: 'Amit Verma' },
    reservations: {
      vehicle_number: 'UP16CD7823',
      parking_lots: { name: 'Chandni Chowk Metro' },
    },
  },
  {
    id: 'fine-demo-4',
    user_id: 'demo-u4',
    reservation_id: null,
    amount: 300,
    reason: 'Failure to scan QR exit code / unpaid balance settlement',
    status: 'waived',
    applied_to_transaction_id: null,
    created_at: daysAgo(4.2),
    resolved_at: daysAgo(4.1),
    profiles: { full_name: 'Priya Mehra' },
    reservations: {
      vehicle_number: 'DL08EF9012',
      parking_lots: { name: 'Lajpat Nagar Central' },
    },
  },
];

export const DEMO_USERS = [
  {
    id: 'usr-admin-1',
    email: 'demo.admin@nigampark.gov.in',
    full_name: 'Dr. Sanjay Mathur (MCD Commissioner)',
    created_at: daysAgo(180),
    role: 'admin' as const,
    role_id: 'role-1',
    assigned_lot_id: null,
  },
  {
    id: 'usr-att-1',
    email: 'demo.attendant@nigampark.gov.in',
    full_name: 'Rameshwar Lal (Senior Gate Marshal)',
    created_at: daysAgo(120),
    role: 'attendant' as const,
    role_id: 'role-2',
    assigned_lot_id: 'cp-block-a',
  },
  {
    id: 'usr-att-2',
    email: 'satish.attendant@nigampark.gov.in',
    full_name: 'Satish Kumar (Barrier Attendant)',
    created_at: daysAgo(90),
    role: 'attendant' as const,
    role_id: 'role-3',
    assigned_lot_id: 'kb-market',
  },
  {
    id: 'usr-att-3',
    email: 'harish.attendant@nigampark.gov.in',
    full_name: 'Harish Chander (Booth Operator)',
    created_at: daysAgo(60),
    role: 'attendant' as const,
    role_id: 'role-4',
    assigned_lot_id: 'cc-metro',
  },
  {
    id: 'usr-cit-1',
    email: 'demo.citizen@nigampark.gov.in',
    full_name: 'Rajesh Sharma (Verified Citizen)',
    created_at: daysAgo(45),
    role: 'citizen' as const,
    role_id: 'role-5',
    assigned_lot_id: null,
  },
  {
    id: 'usr-cit-2',
    email: 'priya.mehra@gmail.com',
    full_name: 'Priya Mehra',
    created_at: daysAgo(30),
    role: 'citizen' as const,
    role_id: 'role-6',
    assigned_lot_id: null,
  },
  {
    id: 'usr-cit-3',
    email: 'amit.verma@corp.in',
    full_name: 'Amit Verma (Fleet Coordinator)',
    created_at: daysAgo(15),
    role: 'citizen' as const,
    role_id: 'role-7',
    assigned_lot_id: null,
  },
];

export const DEMO_SHIFT_TEMPLATES = [
  { id: 'tpl-1', name: 'Morning Rush Shift (07:00 - 15:00)', start_time: '07:00', end_time: '15:00', created_at: daysAgo(60) },
  { id: 'tpl-2', name: 'Evening Peak Shift (15:00 - 23:00)', start_time: '15:00', end_time: '23:00', created_at: daysAgo(60) },
  { id: 'tpl-3', name: 'Night Security Shift (23:00 - 07:00)', start_time: '23:00', end_time: '07:00', created_at: daysAgo(60) },
];

// Attendant pool rotated across MCD parking lots
const ATTENDANT_POOL = [
  { id: 'usr-att-1', name: 'Rameshwar Lal (Senior Gate Marshal)', lotId: 'cp-block-a', lotName: 'Connaught Place Block A' },
  { id: 'usr-att-2', name: 'Satish Kumar (Barrier Attendant)', lotId: 'kb-market', lotName: 'Karol Bagh Market' },
  { id: 'usr-att-3', name: 'Harish Chander (Booth Operator)', lotId: 'cc-metro', lotName: 'Chandni Chowk Metro' },
  { id: 'usr-att-1', name: 'Rameshwar Lal (Senior Gate Marshal)', lotId: 'np-it', lotName: 'Nehru Place IT Hub' },
  { id: 'usr-att-2', name: 'Satish Kumar (Barrier Attendant)', lotId: 'ln-central', lotName: 'Lajpat Nagar Central' },
  { id: 'usr-att-3', name: 'Harish Chander (Booth Operator)', lotId: 'sn-market', lotName: 'Sarojini Nagar Market' },
];

export const DEMO_ATTENDANT_SHIFTS = (() => {
  const list: Array<{
    id: string;
    user_id: string;
    lot_id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    parking_lots: { name: string };
    profiles: { full_name: string };
  }> = [];

  // Generate shifts for every day from 14 days ago to 90 days into the future
  for (let d = -14; d <= 90; d++) {
    const dateStr = futureDateStr(d);
    const morningAttendant = ATTENDANT_POOL[Math.abs(d) % ATTENDANT_POOL.length];
    const eveningAttendant = ATTENDANT_POOL[(Math.abs(d) + 1) % ATTENDANT_POOL.length];
    const nightAttendant = ATTENDANT_POOL[(Math.abs(d) + 2) % ATTENDANT_POOL.length];

    const morningStatus = d < 0 ? 'completed' : d === 0 ? 'in_progress' : 'scheduled';
    const eveningStatus = d < 0 ? 'completed' : 'scheduled';
    const nightStatus = d < 0 ? 'completed' : 'scheduled';

    list.push(
      {
        id: `shift-${d}-m`,
        user_id: morningAttendant.id,
        lot_id: morningAttendant.lotId,
        shift_date: dateStr,
        start_time: '07:00:00',
        end_time: '15:00:00',
        status: morningStatus,
        created_at: daysAgo(Math.max(1, -d + 2)),
        updated_at: daysAgo(0.1),
        parking_lots: { name: morningAttendant.lotName },
        profiles: { full_name: morningAttendant.name },
      },
      {
        id: `shift-${d}-e`,
        user_id: eveningAttendant.id,
        lot_id: eveningAttendant.lotId,
        shift_date: dateStr,
        start_time: '15:00:00',
        end_time: '23:00:00',
        status: eveningStatus,
        created_at: daysAgo(Math.max(1, -d + 2)),
        updated_at: daysAgo(0.1),
        parking_lots: { name: eveningAttendant.lotName },
        profiles: { full_name: eveningAttendant.name },
      },
      {
        id: `shift-${d}-n`,
        user_id: nightAttendant.id,
        lot_id: nightAttendant.lotId,
        shift_date: dateStr,
        start_time: '23:00:00',
        end_time: '07:00:00',
        status: nightStatus,
        created_at: daysAgo(Math.max(1, -d + 2)),
        updated_at: daysAgo(0.1),
        parking_lots: { name: nightAttendant.lotName },
        profiles: { full_name: nightAttendant.name },
      }
    );
  }

  return list;
})();

export const DEMO_REVENUE_FORECASTS = (() => {
  const lots = ['cp-block-a', 'kb-market', 'np-it', 'cc-metro', 'ln-central', 'sn-market'];
  const baseRevs: Record<string, number> = {
    'cp-block-a': 56000,
    'kb-market': 42000,
    'np-it': 48000,
    'cc-metro': 31000,
    'ln-central': 37000,
    'sn-market': 39000,
  };

  const forecasts = [];
  // Generate forecasts for every day from today to 90 days into the future
  for (let i = 0; i < 90; i++) {
    const date = futureDateStr(i);
    const dayOfWeek = new Date(Date.now() + i * 86400000).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    lots.forEach((lotId) => {
      const base = baseRevs[lotId] || 45000;
      const weekendMultiplier = isWeekend ? 1.35 : 1.0;
      const seasonalWave = Math.sin((i + lotId.length) * 0.8) * 5500;
      const predicted = Math.round((base * weekendMultiplier) + seasonalWave);

      forecasts.push({
        id: `rev-fc-${lotId}-${i}`,
        lot_id: lotId,
        forecast_date: date,
        predicted_revenue: predicted,
        confidence_score: Number((0.92 + (Math.sin(i) * 0.05)).toFixed(2)),
        created_at: daysAgo(1),
      });
    });
  }
  return forecasts;
})();

export const DEMO_OCCUPANCY_FORECASTS = (() => {
  const lots = ['cp-block-a', 'kb-market', 'np-it', 'cc-metro', 'ln-central', 'sn-market'];
  const list = [];

  // Generate hourly occupancy forecasts for every day for the next 90 days
  for (let d = 0; d < 90; d++) {
    for (let h = 8; h <= 22; h += 2) {
      const dt = new Date(Date.now() + d * 86400000);
      dt.setHours(h, 0, 0, 0);
      const isPeak = (h >= 11 && h <= 14) || (h >= 17 && h <= 20);

      lots.forEach((lotId, lIdx) => {
        const lotOffset = lIdx * 3;
        const predictedOcc = isPeak 
          ? 78 + ((h + lotOffset) % 18) 
          : 42 + ((h + lotOffset) % 24);

        list.push({
          id: `occ-fc-${lotId}-${d}-${h}`,
          parking_lot_id: lotId,
          forecast_time: dt.toISOString(),
          predicted_occupancy: Math.min(98, predictedOcc),
          confidence_score: Number((0.91 + (Math.cos(d + h) * 0.06)).toFixed(2)),
          created_at: daysAgo(1),
        });
      });
    }
  }
  return list;
})();

export const DEMO_ATTENDANT_LEADERBOARD = [
  {
    user_id: 'usr-att-1',
    full_name: 'Rameshwar Lal (Senior Gate Marshal)',
    total_collections: 19450,
    transaction_count: 98,
    efficiency_score: 9.8,
    rank: 1,
  },
  {
    user_id: 'usr-att-2',
    full_name: 'Satish Kumar (Barrier Attendant)',
    total_collections: 16200,
    transaction_count: 82,
    efficiency_score: 9.2,
    rank: 2,
  },
  {
    user_id: 'usr-att-3',
    full_name: 'Harish Chander (Booth Operator)',
    total_collections: 13800,
    transaction_count: 70,
    efficiency_score: 8.7,
    rank: 3,
  },
  {
    user_id: 'usr-att-4',
    full_name: 'Vikas Singh (Distribution Gate)',
    total_collections: 10400,
    transaction_count: 54,
    efficiency_score: 8.1,
    rank: 4,
  },
  {
    user_id: 'usr-att-5',
    full_name: 'Suresh Yadav (Logistics Marshal)',
    total_collections: 8200,
    transaction_count: 42,
    efficiency_score: 7.6,
    rank: 5,
  },
];

export const DEMO_PERFORMANCE_HISTORY = (() => {
  const history = [];
  const baseAmounts = [4200, 4850, 5200, 4100, 4950, 5600, 5100];
  const txCounts = [24, 28, 31, 23, 29, 34, 30];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    history.push({
      date: d,
      collections: baseAmounts[6 - i],
      transactions: txCounts[6 - i],
    });
  }
  return history;
})();

export const DEMO_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'fa-1',
    created_at: daysAgo(0.05),
    severity: 'CRITICAL',
    location: 'Connaught Place Block A - Exit Booth #2',
    description: 'Cash collection discrepancy: System recorded ₹2,400 physical cash collection mismatch with turnstile loop counts.',
    status: 'NEW',
    metadata: { discrepancy_amount: 2400, expected_count: 60, logged_count: 42, operator: 'Attendant #104' },
  },
  {
    id: 'fa-2',
    created_at: daysAgo(0.2),
    severity: 'HIGH',
    location: 'Karol Bagh Market - Slot D-01',
    description: 'Ghost vehicle anomaly: Camera detected vehicle entering without POS barrier check-in trigger.',
    status: 'INVESTIGATING',
    metadata: { plate: 'HR26DK4589', vehicle_type: 'SUV', duration_minutes: 85 },
  },
  {
    id: 'fa-3',
    created_at: daysAgo(0.8),
    severity: 'MEDIUM',
    location: 'Chandni Chowk Metro - East Gate',
    description: 'Repeated fast-pass barcode reuse: Same monthly pass token scanned at two entry gates simultaneously within 3 minutes.',
    status: 'NEW',
    metadata: { pass_id: 'PASS-MCD-8921', gate_a: 'Gate 1', gate_b: 'Gate 3' },
  },
  {
    id: 'fa-4',
    created_at: daysAgo(1.5),
    severity: 'LOW',
    location: 'Nehru Place IT Hub - Level B1',
    description: 'Frequent manual override by attendant without supervisor authorization pin.',
    status: 'INVESTIGATING',
    metadata: { override_count_today: 7, threshold: 3 },
  },
];

export const DEMO_SURGE_RULES = [
  {
    id: 'surge-1',
    lot_id: null,
    min_occupancy_percent: 75,
    max_occupancy_percent: 85,
    multiplier: 1.25,
    is_active: true,
    created_at: daysAgo(60),
  },
  {
    id: 'surge-2',
    lot_id: null,
    min_occupancy_percent: 85,
    max_occupancy_percent: 95,
    multiplier: 1.5,
    is_active: true,
    created_at: daysAgo(60),
  },
  {
    id: 'surge-3',
    lot_id: null,
    min_occupancy_percent: 95,
    max_occupancy_percent: 100,
    multiplier: 2.0,
    is_active: true,
    created_at: daysAgo(60),
  },
  {
    id: 'surge-4',
    lot_id: 'cp-block-a',
    min_occupancy_percent: 80,
    max_occupancy_percent: 100,
    multiplier: 1.75,
    is_active: true,
    created_at: daysAgo(30),
  },
];

export const DEMO_PARKING_REVIEWS = [
  {
    id: 'rev-1',
    lot_id: 'cp-block-a',
    user_id: 'usr-cit-1',
    rating: 5,
    review_text: 'Excellent automated MCD parking! FASTag debit was instantaneous at the boom barrier. Very clean EV charging spots available.',
    photo_url: null,
    is_verified: true,
    helpful_count: 24,
    created_at: daysAgo(1),
    parking_lots: { name: 'Connaught Place Block A' },
    profiles: { full_name: 'Rajesh Sharma', avatar_url: null },
  },
  {
    id: 'rev-2',
    lot_id: 'kb-market',
    user_id: 'usr-cit-2',
    rating: 4,
    review_text: 'Attendants were helpful during peak festival weekend rush. Multi-level automated stacker saved me at least 30 minutes of circling.',
    photo_url: null,
    is_verified: true,
    helpful_count: 18,
    created_at: daysAgo(2),
    parking_lots: { name: 'Karol Bagh Market' },
    profiles: { full_name: 'Priya Mehra', avatar_url: null },
  },
  {
    id: 'rev-3',
    lot_id: 'cc-metro',
    user_id: 'usr-cit-3',
    rating: 4,
    review_text: 'Super convenient for Old Delhi market hopping. Metro station is literally right next to the pedestrian exit ramp.',
    photo_url: null,
    is_verified: true,
    helpful_count: 12,
    created_at: daysAgo(4),
    parking_lots: { name: 'Chandni Chowk Metro' },
    profiles: { full_name: 'Amit Verma', avatar_url: null },
  },
  {
    id: 'rev-4',
    lot_id: 'np-it',
    user_id: 'usr-cit-4',
    rating: 5,
    review_text: 'Best tech parking facility in South Delhi. Real-time availability showed exactly 14 spots left on my phone before I arrived.',
    photo_url: null,
    is_verified: true,
    helpful_count: 31,
    created_at: daysAgo(6),
    parking_lots: { name: 'Nehru Place IT Hub' },
    profiles: { full_name: 'Vikas Malhotra', avatar_url: null },
  },
];

export const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Parking Booking Confirmed',
    message: 'Your spot at Connaught Place Block A is reserved for today 14:00 - 18:00.',
    type: 'booking',
    created_at: daysAgo(0.1),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'FASTag Payment Receipt: ₹60',
    message: 'Automatic exit debit processed at Chandni Chowk Metro Gate 2.',
    type: 'payment',
    created_at: daysAgo(0.5),
    read: true,
  },
  {
    id: 'notif-3',
    title: 'Overstay Alert Warning',
    message: 'Your parking at Karol Bagh will expire in 15 minutes. Extend online to avoid municipal penalty.',
    type: 'alert',
    created_at: daysAgo(1),
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Monthly Pass Renewal Confirmation',
    message: 'Unlimited All-Delhi Central Zone pass renewed successfully.',
    type: 'pass',
    created_at: daysAgo(3),
    read: true,
  },
];

/** Returns live rows when present, otherwise the demo sample. */
export function withDemoFallback<T>(rows: T[] | undefined | null, demo: unknown[]): T[] {
  if (rows && rows.length > 0) return rows;
  return demo as T[];
}

export const DEMO_OCCUPANCY_ANALYTICS = [
  { lotName: 'Connaught Place Block A', zone: 'New Delhi', occupancy: 156, capacity: 200, percentage: 78 },
  { lotName: 'Karol Bagh Market', zone: 'Central Delhi', occupancy: 87, capacity: 150, percentage: 58 },
  { lotName: 'Lajpat Nagar Central', zone: 'South Delhi', occupancy: 45, capacity: 120, percentage: 38 },
  { lotName: 'Chandni Chowk Metro', zone: 'Old Delhi', occupancy: 72, capacity: 80, percentage: 90 },
  { lotName: 'Nehru Place IT Hub', zone: 'South-East Delhi', occupancy: 98, capacity: 180, percentage: 54 },
  { lotName: 'Sarojini Nagar Market', zone: 'South-West Delhi', occupancy: 89, capacity: 100, percentage: 89 },
  { lotName: 'Saket City Centre Gate 2', zone: 'South Delhi', occupancy: 185, capacity: 220, percentage: 84 },
];

export const DEMO_SUMMARY_STATS = {
  todayRevenue: 142850,
  yesterdayRevenue: 125100,
  weekRevenue: 986400,
  avgDailyRevenue: 140914,
  revenueChange: 14,
  transactionsToday: 1428,
  transactionsWeek: 9840,
};

export const DEMO_OVERSTAY_RECORDS = [
  {
    id: 'ov-1',
    vehicle_number: 'DL 01 AB 1234',
    amount: 450,
    entry_time: daysAgo(0.35),
    exit_time: null,
    created_at: daysAgo(0.08),
    parking_lots: { name: 'Connaught Place Block A', zone: 'New Delhi' },
  },
  {
    id: 'ov-2',
    vehicle_number: 'HR 26 DQ 5678',
    amount: 300,
    entry_time: daysAgo(0.42),
    exit_time: null,
    created_at: daysAgo(0.14),
    parking_lots: { name: 'Karol Bagh Market', zone: 'Central Delhi' },
  },
  {
    id: 'ov-3',
    vehicle_number: 'UP 16 CD 7823',
    amount: 600,
    entry_time: daysAgo(0.55),
    exit_time: null,
    created_at: daysAgo(0.22),
    parking_lots: { name: 'Nehru Place IT Hub', zone: 'South-East Delhi' },
  },
  {
    id: 'ov-4',
    vehicle_number: 'DL 03 EF 9012',
    amount: 250,
    entry_time: daysAgo(0.38),
    exit_time: null,
    created_at: daysAgo(0.28),
    parking_lots: { name: 'Chandni Chowk Metro', zone: 'Old Delhi' },
  },
  {
    id: 'ov-5',
    vehicle_number: 'DL 08 QR 3344',
    amount: 400,
    entry_time: daysAgo(0.62),
    exit_time: null,
    created_at: daysAgo(0.32),
    parking_lots: { name: 'Sarojini Nagar Market', zone: 'South-West Delhi' },
  },
  {
    id: 'ov-6',
    vehicle_number: 'HR 55 HC 3344',
    amount: 350,
    entry_time: daysAgo(0.48),
    exit_time: null,
    created_at: daysAgo(0.38),
    parking_lots: { name: 'Lajpat Nagar Central', zone: 'South Delhi' },
  },
];

export function generateDemoRevenueAnalytics(timeRange: 'daily' | 'weekly' | 'monthly') {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (timeRange === 'daily') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86400000);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseFastag = isWeekend ? 88000 : 72000;
      const baseUpi = isWeekend ? 38000 : 31000;
      const baseCash = 14000;
      const baseOverstay = isWeekend ? 6500 : 4200;
      const jitter = ((i * 13) % 7 - 3) * 1200;

      const fastag = Math.round(baseFastag + jitter);
      const upi = Math.round(baseUpi + jitter * 0.4);
      const cash = Math.round(baseCash + jitter * 0.2);
      const overstayFee = Math.round(baseOverstay + jitter * 0.1);
      const revenue = fastag + upi + cash + overstayFee;

      return {
        date: d.toISOString().split('T')[0],
        displayDate: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        revenue,
        transactions: Math.round(revenue / 95),
        fastag,
        cash,
        upi,
        overstayFee,
      };
    });
  }

  if (timeRange === 'weekly') {
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(now.getTime() - (3 - i) * 7 * 86400000);
      const fastag = 490000 + i * 18000;
      const upi = 215000 + i * 9000;
      const cash = 92000 - i * 3000;
      const overstayFee = 32000 + i * 2500;
      const revenue = fastag + upi + cash + overstayFee;

      return {
        date: d.toISOString().split('T')[0],
        displayDate: `Week ${40 + i}`,
        revenue,
        transactions: Math.round(revenue / 92),
        fastag,
        cash,
        upi,
        overstayFee,
      };
    });
  }

  // Monthly
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const fastag = 2100000 + i * 95000;
    const upi = 920000 + i * 48000;
    const cash = 380000 - i * 15000;
    const overstayFee = 145000 + i * 11000;
    const revenue = fastag + upi + cash + overstayFee;

    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      displayDate: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      revenue,
      transactions: Math.round(revenue / 90),
      fastag,
      cash,
      upi,
      overstayFee,
    };
  });
}

export function generateDemoReservationStats(timeRange: 'daily' | 'weekly' | 'monthly') {
  if (timeRange === 'daily') {
    return {
      total: 184,
      confirmed: 42,
      checkedIn: 28,
      completed: 106,
      cancelled: 8,
      totalRevenue: 34800,
    };
  }
  if (timeRange === 'weekly') {
    return {
      total: 1240,
      confirmed: 180,
      checkedIn: 95,
      completed: 915,
      cancelled: 50,
      totalRevenue: 248000,
    };
  }
  return {
    total: 5480,
    confirmed: 420,
    checkedIn: 180,
    completed: 4620,
    cancelled: 260,
    totalRevenue: 1096000,
  };
}

export function generateDemoOverstayTrends(range: 'weekly' | 'monthly') {
  const now = new Date();
  const days = range === 'weekly' ? 7 : 30;
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const data = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const count = Math.round((isWeekend ? 12 : 7) + ((i * 5) % 4));
    const amount = count * (380 + ((i * 37) % 120));

    return {
      date: d.toISOString().split('T')[0],
      displayDate: range === 'weekly' ? daysOfWeek[d.getDay()] : `${monthNames[d.getMonth()]} ${d.getDate()}`,
      amount,
      count,
    };
  });

  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = data.length > 0 ? Math.round(totalAmount / data.length) : 0;

  return {
    data,
    totalAmount,
    totalCount,
    avgPerDay,
  };
}

export const DEMO_HISTORICAL_REVENUE_14D = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86400000);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    stat_date: d.toISOString().split('T')[0],
    date: `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
    revenue: Math.round(124000 + Math.sin(i * 0.8) * 18000 + ((i * 17) % 7) * 2000),
  };
});

export const DEMO_USAGE_STATS_168H = (() => {
  const list = [];
  const now = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(now.getTime() - (6 - d) * 86400000);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (let h = 0; h < 24; h++) {
      let occ = 12;
      if (h >= 7 && h <= 9) occ = isWeekend ? 35 : 62;
      else if (h >= 10 && h <= 13) occ = isWeekend ? 88 : 82;
      else if (h >= 14 && h <= 16) occ = isWeekend ? 72 : 64;
      else if (h >= 17 && h <= 20) occ = isWeekend ? 94 : 88;
      else if (h >= 21 && h <= 23) occ = 32;

      occ = Math.min(98, Math.max(5, occ + ((h + d) % 7 - 3)));

      list.push({
        id: `usage-h-${d}-${h}`,
        lot_id: 'cp-block-a',
        stat_date: date.toISOString().split('T')[0],
        hour_of_day: h,
        avg_occupancy: occ,
        peak_occupancy: Math.min(100, occ + 6),
        total_vehicles: Math.round(occ * 1.8),
        revenue: occ * 40,
      });
    }
  }
  return list;
})();

export const DEMO_REALTIME_GATE_EVENTS = [
  {
    id: 'gt-1',
    plate: 'DL 01 AB 1234',
    lot: 'Connaught Place Block A',
    gate: 'Gate 2 - Barrier Entry',
    mode: 'FASTag Auto-Debit',
    type: 'ENTRY',
    amount: '₹40',
    status: 'VERIFIED',
    iou: '98.4%',
  },
  {
    id: 'gt-2',
    plate: 'HR 26 DQ 5678',
    lot: 'Karol Bagh Market',
    gate: 'Main Entry Lane 1',
    mode: 'ANPR Barrier Lift',
    type: 'ENTRY',
    amount: '₹30',
    status: 'VERIFIED',
    iou: '96.8%',
  },
  {
    id: 'gt-3',
    plate: 'UP 16 CD 7823',
    lot: 'Nehru Place IT Hub',
    gate: 'Outer Plaza Gate 3',
    mode: 'UPI Dynamic QR',
    type: 'EXIT',
    amount: '₹70',
    status: 'SUCCESS',
    iou: '99.1%',
  },
  {
    id: 'gt-4',
    plate: 'DL 03 EF 9012',
    lot: 'Chandni Chowk Metro',
    gate: 'North Ramp Exit',
    mode: 'FASTag Exit',
    type: 'EXIT',
    amount: '₹60',
    status: 'SUCCESS',
    iou: '97.5%',
  },
  {
    id: 'gt-5',
    plate: 'DL 08 QR 3344',
    lot: 'Sarojini Nagar Market',
    gate: 'Gate 1 Automated',
    mode: 'Overstay Flagged',
    type: 'ALERT',
    amount: '₹350 penalty',
    status: 'FLAGGED',
    iou: '95.2%',
  },
  {
    id: 'gt-6',
    plate: 'HR 55 HC 3344',
    lot: 'Lajpat Nagar Central',
    gate: 'South Entry Gate',
    mode: 'FASTag RFID',
    type: 'ENTRY',
    amount: '₹25',
    status: 'VERIFIED',
    iou: '98.9%',
  },
];


