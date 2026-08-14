import { useLocation } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';

interface RouteMeta {
  title: string;
  description: string;
  noIndex?: boolean;
}

/**
 * Per-route titles/descriptions so every page has unique metadata.
 * Pages that render their own <SEOHead /> override these (they mount later).
 */
const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Smart Parking Dashboard',
    description: 'Live parking availability, bookings and revenue insights for Delhi on the official MCD NIGAM-Park platform.',
  },
  '/citizen': {
    title: 'Find & Book Parking in Delhi',
    description: 'Search nearby MCD parking lots, check live availability, compare rates and reserve your spot in seconds.',
  },
  '/auth': {
    title: 'Sign In',
    description: 'Sign in or create your NIGAM-Park account to book parking, manage reservations and pay fines online.',
    noIndex: true,
  },
  '/live-map': {
    title: 'Live Parking Map',
    description: 'Real-time map of Delhi parking lots with occupancy, pricing and turn-by-turn navigation to free slots.',
  },
  '/my-reservations': {
    title: 'My Reservations',
    description: 'View, extend or cancel your upcoming NIGAM-Park parking reservations.',
    noIndex: true,
  },
  '/parking-history': {
    title: 'Parking History',
    description: 'Your past parking sessions, payments and receipts in one place.',
    noIndex: true,
  },
  '/profile': {
    title: 'My Profile',
    description: 'Manage your saved vehicles, contact details and NIGAM-Park account preferences.',
    noIndex: true,
  },
  '/notifications': {
    title: 'Notification Preferences',
    description: 'Choose how NIGAM-Park alerts you about reservations, expiry reminders and fines.',
    noIndex: true,
  },
  '/loyalty': {
    title: 'Loyalty Rewards',
    description: 'Earn points on every parking session and redeem them for discounts across Delhi parking lots.',
  },
  '/referral': {
    title: 'Refer & Earn',
    description: 'Invite friends to NIGAM-Park and earn free parking credits when they complete their first booking.',
  },

  '/report-violation': {
    title: 'Report a Parking Violation',
    description: 'Report illegal parking, overcharging or fake QR codes directly to the Municipal Corporation of Delhi.',
  },
  '/kiosk': {
    title: 'Parking Kiosk Mode',
    description: 'Full-screen kiosk interface for on-site NIGAM-Park parking check-in and payment.',
    noIndex: true,
  },
  '/install': {
    title: 'Install the App',
    description: 'Install NIGAM-Park on your phone for offline access, faster booking and instant parking alerts.',
  },
  '/vision-dashboard': {
    title: 'Vision AI Dashboard',
    description: 'CCTV-based occupancy detection and camera health monitoring for MCD parking lots.',
    noIndex: true,
  },
  '/fraud-hunter': {
    title: 'Fraud Hunter',
    description: 'Revenue leakage detection and fraud alert investigation console for MCD officials.',
    noIndex: true,
  },
  '/attendant/checkin': {
    title: 'Attendant Check-In',
    description: 'Scan vehicle QR codes and record parking check-ins from the attendant terminal.',
    noIndex: true,
  },
  '/attendant/performance': {
    title: 'Attendant Performance',
    description: 'Collection totals, shift compliance and performance metrics for parking attendants.',
    noIndex: true,
  },
  '/admin/users': {
    title: 'User Management',
    description: 'Administer citizen, attendant and commissioner accounts across the NIGAM-Park platform.',
    noIndex: true,
  },
  '/admin/analytics': {
    title: 'Revenue Analytics',
    description: 'Revenue, occupancy and demand analytics across all MCD parking zones.',
    noIndex: true,
  },
  '/admin/parking-lots': {
    title: 'Parking Lot Management',
    description: 'Create and configure MCD parking lots, capacity, rates and attendants.',
    noIndex: true,
  },
  '/admin/fines': {
    title: 'Fines Management',
    description: 'Issue, track and reconcile parking fines across Delhi.',
    noIndex: true,
  },
  '/admin/shifts': {
    title: 'Shift Scheduling',
    description: 'Plan and assign attendant shifts across MCD parking lots.',
    noIndex: true,
  },
  '/admin/realtime': {
    title: 'Real-Time Analytics',
    description: 'Live occupancy, transactions and alert monitoring for MCD parking operations.',
    noIndex: true,
  },
  '/admin/violations': {
    title: 'Violation Moderation',
    description: 'Review and act on citizen-submitted parking violation reports.',
    noIndex: true,
  },
  '/admin/reviews': {
    title: 'Review Moderation',
    description: 'Moderate parking lot reviews and publish official replies.',
    noIndex: true,
  },
  '/admin/surge-pricing': {
    title: 'Surge Pricing Configuration',
    description: 'Configure occupancy-based dynamic pricing rules for MCD parking lots.',
    noIndex: true,
  },
};

export function RouteSEO() {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname];
  if (!meta) return null;

  return (
    <SEOHead
      title={meta.title}
      description={meta.description}
      path={pathname}
      noIndex={meta.noIndex}
    />
  );
}
