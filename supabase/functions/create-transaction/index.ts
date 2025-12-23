import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vehicle number validation - flexible Indian format
const vehicleNumberSchema = z.string()
  .min(6, 'Vehicle number too short')
  .max(15, 'Vehicle number too long')
  .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/, 'Invalid vehicle number format');

// Transaction validation schema
const transactionSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  vehicle_number: vehicleNumberSchema,
  amount: z.number().int().positive('Amount must be positive').max(100000, 'Amount exceeds maximum'),
  payment_method: z.enum(['FASTag', 'Cash', 'UPI'], { errorMap: () => ({ message: 'Invalid payment method' }) }),
  status: z.enum(['pending', 'completed', 'failed']),
  entry_time: z.string(),
  exit_time: z.string().nullable().optional(),
});

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token for auth check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} creating transaction`);

    // Check user role using service client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Role check failed:', roleError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only allow admin and attendant to create transactions
    const allowedRoles = ['admin', 'attendant'];
    if (!roleData || !allowedRoles.includes(roleData.role)) {
      console.error(`User ${user.id} has role ${roleData?.role}, not authorized`);
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only admins and attendants can create transactions.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    console.log('Received transaction data:', JSON.stringify(body));

    const validationResult = transactionSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transactionData = validationResult.data;

    // Insert transaction using service role (bypasses RLS)
    const { data, error } = await adminClient
      .from('transactions')
      .insert({
        lot_id: transactionData.lot_id,
        vehicle_number: transactionData.vehicle_number,
        amount: transactionData.amount,
        payment_method: transactionData.payment_method,
        status: transactionData.status,
        entry_time: transactionData.entry_time,
        exit_time: transactionData.exit_time || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert failed:', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction created successfully:', data.id);

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
