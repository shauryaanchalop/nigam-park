import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoUserRequest {
  role: 'admin' | 'attendant' | 'citizen';
}

const DEMO_USERS = {
  admin: {
    email: 'demo.admin@nigampark.gov.in',
    password: 'DemoAdmin123!',
    fullName: 'Demo Administrator',
  },
  attendant: {
    email: 'demo.attendant@nigampark.gov.in', 
    password: 'DemoAttendant123!',
    fullName: 'Demo Attendant',
  },
  citizen: {
    email: 'demo.citizen@nigampark.gov.in',
    password: 'DemoCitizen123!',
    fullName: 'Demo Citizen',
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role } = await req.json() as DemoUserRequest;
    
    if (!role || !DEMO_USERS[role]) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, attendant, or citizen.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const demoUser = DEMO_USERS[role];
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log(`Processing demo login for role: ${role}`);

    // Try to sign in first (user might already exist)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: demoUser.email,
      password: demoUser.password,
    });

    if (signInData?.user) {
      console.log(`Demo user ${role} signed in successfully`);
      
      // Verify role is correct
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', signInData.user.id)
        .single();

      if (roleData?.role !== role) {
        // Update role if different
        await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', signInData.user.id);
        console.log(`Updated demo user role to ${role}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          email: demoUser.email,
          password: demoUser.password,
          message: 'Demo user ready for login'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User doesn't exist, create them
    console.log(`Creating new demo user for role: ${role}`);
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      email_confirm: true,
      user_metadata: { full_name: demoUser.fullName },
    });

    if (createError) {
      console.error('Error creating demo user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create demo user', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newUser?.user) {
      // Update role from default 'citizen' to requested role
      if (role !== 'citizen') {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', newUser.user.id);

        if (roleError) {
          console.error('Error updating role:', roleError);
        } else {
          console.log(`Set demo user role to ${role}`);
        }
      }

      // Create profile if trigger didn't
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', newUser.user.id)
        .single();

      if (!existingProfile) {
        await supabaseAdmin
          .from('profiles')
          .insert({ user_id: newUser.user.id, full_name: demoUser.fullName });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        email: demoUser.email,
        password: demoUser.password,
        message: 'Demo user created and ready for login'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Demo login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
