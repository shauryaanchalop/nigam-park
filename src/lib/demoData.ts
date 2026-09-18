/**
 * Demo fallbacks — used only when a signed-in user has no records of their own,
 * so every screen in the prototype shows realistic content instead of an empty state.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

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

/** Returns live rows when present, otherwise the demo sample. */
export function withDemoFallback<T>(rows: T[] | undefined | null, demo: unknown[]): T[] {
  if (rows && rows.length > 0) return rows;
  return demo as T[];
}
