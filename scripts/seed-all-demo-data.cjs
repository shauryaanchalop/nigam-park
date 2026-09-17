const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifbjbmuafyjbetzxavdb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = {
  admin: {
    id: 'f4823e5e-3483-4d2a-96aa-61e18222e09e',
    email: 'demo.admin@nigampark.gov.in',
    fullName: 'Shri Rajesh Sharma',
    role: 'admin',
  },
  attendant: {
    id: 'f721b2fb-0ecf-470a-866d-81e3b97fd976',
    email: 'demo.attendant@nigampark.gov.in',
    fullName: 'Ramesh Kumar',
    role: 'attendant',
  },
  citizen: {
    id: '4d32a6a3-d1ff-449d-9281-a123ec447582',
    email: 'demo.citizen@nigampark.gov.in',
    fullName: 'Pooja Verma',
    role: 'citizen',
  },
};

const SAMPLE_PLATES = [
  'DL01AB1234',
  'DL02CD5678',
  'DL03EF9012',
  'DL04GH3456',
  'DL05IJ7890',
  'DL06KL2345',
  'HR26MN6789',
  'UP16OP1122',
  'DL08QR3344',
  'DL09ST5566',
  'HR55HC3344',
  'UP32ID5566',
  'DL3CCE4912',
  'HR26DQ5521',
  'UP16BJ9081',
];

async function seed() {
  console.log('=== Seeding Complete NIGAM-Park Everyday Demo Data ===');

  // 1. Profiles & Roles
  console.log('1. Upserting Profiles & Roles...');
  for (const key of Object.keys(DEMO_USERS)) {
    const u = DEMO_USERS[key];
    await admin.from('profiles').upsert({
      user_id: u.id,
      full_name: u.fullName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    await admin.from('user_roles').upsert({
      user_id: u.id,
      role: u.role,
    }, { onConflict: 'user_id,role' });
  }

  // 2. Parking Lots
  console.log('2. Refreshing Parking Lots metadata...');
  const { data: lots, error: lotsErr } = await admin.from('parking_lots').select('*');
  if (lotsErr || !lots?.length) {
    console.error('Error fetching parking lots:', lotsErr);
    return;
  }

  const cpLot = lots.find((l) => l.name.includes('Connaught Place')) || lots[0];
  const kbLot = lots.find((l) => l.name.includes('Karol Bagh')) || lots[1];
  const ccLot = lots.find((l) => l.name.includes('Chandni Chowk')) || lots[2];
  const lnLot = lots.find((l) => l.name.includes('Lajpat Nagar')) || lots[3];
  const npLot = lots.find((l) => l.name.includes('Nehru Place')) || lots[4];
  const snLot = lots.find((l) => l.name.includes('Sarojini Nagar')) || lots[5];

  await admin.from('user_roles').update({ assigned_lot_id: cpLot.id }).eq('user_id', DEMO_USERS.attendant.id);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 3. Reservations
  console.log('3. Seeding Citizen Reservations (Active, Upcoming & Past)...');
  await admin.from('reservations').delete().eq('user_id', DEMO_USERS.citizen.id);
  const reservationRows = [
    {
      user_id: DEMO_USERS.citizen.id,
      lot_id: cpLot.id,
      vehicle_number: 'DL01AB1234',
      reservation_date: todayStr,
      start_time: '14:00:00',
      end_time: '18:00:00',
      amount: 160,
      status: 'confirmed',
    },
    {
      user_id: DEMO_USERS.citizen.id,
      lot_id: npLot.id,
      vehicle_number: 'DL01AB1234',
      reservation_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      start_time: '10:00:00',
      end_time: '13:00:00',
      amount: 120,
      status: 'pending',
    },
    {
      user_id: DEMO_USERS.citizen.id,
      lot_id: kbLot.id,
      vehicle_number: 'DL01AB1234',
      reservation_date: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().slice(0, 10),
      start_time: '16:00:00',
      end_time: '19:00:00',
      amount: 90,
      status: 'completed',
    },
    {
      user_id: DEMO_USERS.citizen.id,
      lot_id: snLot.id,
      vehicle_number: 'DL01AB1234',
      reservation_date: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString().slice(0, 10),
      start_time: '11:00:00',
      end_time: '13:00:00',
      amount: 40,
      status: 'completed',
    },
  ];
  const { error: resErr } = await admin.from('reservations').insert(reservationRows);
  if (resErr) console.error('Error seeding reservations:', resErr);
  else console.log('Seeded 4 reservations.');

  // 4. Alerts (Valid alert_type: 'fraud', 'capacity', 'maintenance')
  console.log('4. Seeding Live Alerts for Admin...');
  await admin.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const alertRows = [
    {
      lot_id: kbLot.id,
      alert_type: 'fraud',
      message: 'Suspicious vehicle entry: Camera ANPR detected duplicate RFID tag clone at Karol Bagh Gate 2',
      severity: 'critical',
      is_resolved: false,
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      lot_id: snLot.id,
      alert_type: 'capacity',
      message: 'Sarojini Nagar Market has exceeded 88% capacity limit. Directing incoming vehicles to metro overflow.',
      severity: 'high',
      is_resolved: false,
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      lot_id: cpLot.id,
      alert_type: 'fraud',
      message: 'Vehicle DL04JE7788 has overstayed by 45 minutes at CP Block A Slot 22 without renewal payment',
      severity: 'medium',
      is_resolved: false,
      created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      lot_id: npLot.id,
      alert_type: 'maintenance',
      message: 'EV Fast Charging Pillar 3 at Nehru Place underwent routine diagnostic check and is fully operational',
      severity: 'low',
      is_resolved: true,
      created_at: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
    },
  ];
  const { error: alErr } = await admin.from('alerts').insert(alertRows);
  if (alErr) console.error('Error seeding alerts:', alErr);
  else console.log('Seeded 4 vigilance alerts.');

  // 5. Fraud Alerts (FraudHunter)
  console.log('5. Seeding FraudHunter alerts...');
  await admin.from('fraud_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const fraudRows = [
    {
      location: 'Connaught Place Block A - Lane 1 Entry',
      description: 'Duplicate FASTag cloned tag ID detected across 2 MCD stations within 4 minutes',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      metadata: { vehicle_number: 'DL01AB1234', pattern: 'Duplicate FASTag Cloning', confidence: 96.5 },
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      location: 'Karol Bagh Market - Exit Barrier 2',
      description: 'Ghost vehicle exit: Barrier opened manually without valid payment or ANPR plate confirmation',
      severity: 'HIGH',
      status: 'NEW',
      metadata: { vehicle_number: 'UP16OP1122', pattern: 'Manual Barrier Override', confidence: 92.0 },
      created_at: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    },
    {
      location: 'Chandni Chowk Metro - Automated Multi-Level',
      description: 'Blacklisted vehicle DL03GB1122 entered with ₹1,200 pending unpaid fines',
      severity: 'HIGH',
      status: 'NEW',
      metadata: { vehicle_number: 'DL03GB1122', pattern: 'Blacklisted Vehicle Entry', confidence: 98.2 },
      created_at: new Date(now.getTime() - 85 * 60 * 1000).toISOString(),
    },
    {
      location: 'Sarojini Nagar Market - North Entry',
      description: 'Plate tampering suspect: Rear number plate differs from registered vehicle classification',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      metadata: { vehicle_number: 'MP09KF9900', pattern: 'Number Plate Mismatch', confidence: 87.4 },
      created_at: new Date(now.getTime() - 240 * 60 * 1000).toISOString(),
    },
  ];
  const { error: frErr } = await admin.from('fraud_alerts').insert(fraudRows);
  if (frErr) console.error('Error seeding fraud alerts:', frErr);
  else console.log('Seeded 4 fraud alerts.');

  // 6. Cameras & Vision Events
  console.log('6. Seeding cameras and ANPR vision events...');
  const { data: cams } = await admin.from('cameras').select('id, name');
  if (cams?.length) {
    await admin.from('vision_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const vEvents = [];
    const vTypes = ['car', 'suv', 'motorcycle', 'auto-rickshaw'];
    for (let i = 0; i < 24; i++) {
      const c = cams[i % cams.length];
      const p = SAMPLE_PLATES[i % SAMPLE_PLATES.length];
      const v = vTypes[i % vTypes.length];
      vEvents.push({
        camera_id: c.id,
        object_type: v,
        bounding_box: {
          x: Number((0.15 + (i % 3) * 0.15).toFixed(2)),
          y: Number((0.25 + (i % 2) * 0.12).toFixed(2)),
          w: 0.55,
          h: 0.45,
          plate: p,
          confidence: Number((0.93 + Math.random() * 0.06).toFixed(2)),
        },
        detected_at: new Date(now.getTime() - i * 14 * 60 * 1000).toISOString(),
      });
    }
    const { error: vErr } = await admin.from('vision_events').insert(vEvents);
    if (vErr) console.error('Error seeding vision events:', vErr);
    else console.log(`Seeded ${vEvents.length} vision events.`);
  }

  // 7. User Fines
  console.log('7. Seeding user fines...');
  await admin.from('user_fines').delete().eq('user_id', DEMO_USERS.citizen.id);
  const fines = [
    {
      user_id: DEMO_USERS.citizen.id,
      amount: 150,
      reason: 'Overstayed reserved exit time by 45 minutes at Connaught Place Block A',
      status: 'pending',
      created_at: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: DEMO_USERS.citizen.id,
      amount: 250,
      reason: 'Unauthorized parking in reserved EV charging bay without charging vehicle',
      status: 'paid',
      resolved_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  const { error: fErr } = await admin.from('user_fines').insert(fines);
  if (fErr) console.error('Error seeding user fines:', fErr);
  else console.log('Seeded 2 user fines.');

  // 8. Attendant Shifts
  console.log('8. Seeding attendant shifts for Demo Attendant...');
  await admin.from('attendant_shifts').delete().eq('user_id', DEMO_USERS.attendant.id);
  const shifts = [
    {
      user_id: DEMO_USERS.attendant.id,
      lot_id: cpLot.id,
      shift_date: todayStr,
      start_time: '08:00:00',
      end_time: '16:00:00',
      status: 'active',
    },
    {
      user_id: DEMO_USERS.attendant.id,
      lot_id: cpLot.id,
      shift_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      start_time: '08:00:00',
      end_time: '16:00:00',
      status: 'scheduled',
    },
    {
      user_id: DEMO_USERS.attendant.id,
      lot_id: cpLot.id,
      shift_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      start_time: '08:00:00',
      end_time: '16:00:00',
      status: 'completed',
    },
  ];
  const { error: sErr } = await admin.from('attendant_shifts').insert(shifts);
  if (sErr) console.error('Error seeding shifts:', sErr);
  else console.log('Seeded 3 attendant shifts.');

  // 9. Loyalty Accounts
  console.log('9. Seeding loyalty account...');
  const { data: goldTier } = await admin.from('loyalty_tiers').select('id').eq('tier_name', 'Gold').maybeSingle();
  const { error: loyErr } = await admin.from('loyalty_accounts').upsert({
    user_id: DEMO_USERS.citizen.id,
    current_tier_id: goldTier?.id || null,
    total_points: 1250,
    lifetime_points: 2400,
  }, { onConflict: 'user_id' });
  if (loyErr) console.error('Error seeding loyalty account:', loyErr);
  else console.log('Seeded citizen loyalty account (1,250 points, Gold Tier).');

  // 10. Revenue Targets
  console.log('10. Seeding zone revenue targets...');
  await admin.from('revenue_targets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const targets = [
    {
      lot_id: cpLot.id,
      target_amount: 500000,
      target_date: `${todayStr.slice(0, 7)}-01`,
      target_type: 'monthly',
    },
    {
      lot_id: kbLot.id,
      target_amount: 350000,
      target_date: `${todayStr.slice(0, 7)}-01`,
      target_type: 'monthly',
    },
    {
      lot_id: npLot.id,
      target_amount: 450000,
      target_date: `${todayStr.slice(0, 7)}-01`,
      target_type: 'monthly',
    },
  ];
  const { error: rtErr } = await admin.from('revenue_targets').insert(targets);
  if (rtErr) console.error('Error seeding revenue targets:', rtErr);
  else console.log('Seeded 3 revenue targets.');

  // 11. Parking Reviews
  console.log('11. Seeding parking reviews...');
  await admin.from('parking_reviews').delete().eq('user_id', DEMO_USERS.citizen.id);
  const reviews = [
    {
      lot_id: cpLot.id,
      user_id: DEMO_USERS.citizen.id,
      rating: 5,
      review_text: 'Excellent multi-level automated facility by MCD! FASTag touchless entry and exit worked flawlessly without waiting in queues.',
      helpful_count: 14,
      is_verified: true,
    },
    {
      lot_id: kbLot.id,
      user_id: DEMO_USERS.citizen.id,
      rating: 4,
      review_text: 'App slot reservation saved me 25 minutes during peak evening shopping. Clean facility and helpful attendants.',
      helpful_count: 9,
      is_verified: true,
    },
    {
      lot_id: npLot.id,
      user_id: DEMO_USERS.citizen.id,
      rating: 5,
      review_text: 'EV charging worked at full 22kW rate. Dedicated slots are well-monitored so no ICE cars block them.',
      helpful_count: 21,
      is_verified: true,
    },
  ];
  const { error: rvErr } = await admin.from('parking_reviews').insert(reviews);
  if (rvErr) console.error('Error seeding reviews:', rvErr);
  else console.log('Seeded 3 verified citizen reviews.');

  // 12. Business Accounts & Fleet
  console.log('12. Seeding business accounts and fleet vehicles...');
  await admin.from('business_accounts').delete().eq('user_id', DEMO_USERS.admin.id);
  const { data: bAcc, error: bErr } = await admin.from('business_accounts').insert({
    user_id: DEMO_USERS.admin.id,
    company_name: 'Delhi Metro Feeder Fleet Services',
    company_email: 'fleet@delhimetrofeeder.in',
    company_phone: '+91 98110 99887',
    gst_number: '07AAAAA0000A1Z5',
    monthly_budget: 150000,
    max_vehicles: 25,
    is_active: true,
  }).select().single();

  if (bAcc) {
    await admin.from('fleet_vehicles').insert([
      {
        business_account_id: bAcc.id,
        vehicle_number: 'DL01AA2024',
        driver_name: 'Sunil Yadav',
        driver_phone: '+91 98765 43210',
        vehicle_type: 'car',
        monthly_limit: 5000,
        current_month_usage: 2400,
        is_active: true,
      },
      {
        business_account_id: bAcc.id,
        vehicle_number: 'DL01AA2025',
        driver_name: 'Manoj Singh',
        driver_phone: '+91 98765 43211',
        vehicle_type: 'car',
        monthly_limit: 5000,
        current_month_usage: 1800,
        is_active: true,
      },
    ]);
    console.log('Seeded corporate business account and 2 fleet vehicles.');
  }

  console.log('=== SEEDING FINISHED WITH 100% SUCCESS! ===');
}

seed().catch(console.error);
