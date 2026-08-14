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

/** Returns live rows when present, otherwise the demo sample. */
export function withDemoFallback<T>(rows: T[] | undefined | null, demo: unknown[]): T[] {
  if (rows && rows.length > 0) return rows;
  return demo as T[];
}
