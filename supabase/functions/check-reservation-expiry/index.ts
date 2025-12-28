import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Reservation {
  id: string;
  user_id: string;
  lot_id: string;
  vehicle_number: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  amount: number;
  status: string;
  notification_30_sent: boolean;
  notification_15_sent: boolean;
  checked_in_at: string | null;
  fine_applied: boolean;
  parking_lots: {
    name: string;
    zone: string;
  };
}

interface Profile {
  full_name: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    console.log(`[${now.toISOString()}] Running reservation expiry check...`);
    console.log(`Today: ${today}, Current time: ${currentTime}`);

    // Fetch confirmed reservations for today
    const { data: reservations, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        parking_lots (name, zone)
      `)
      .eq("reservation_date", today)
      .eq("status", "confirmed");

    if (fetchError) {
      console.error("Error fetching reservations:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${reservations?.length || 0} confirmed reservations for today`);

    const results = {
      notifications_sent: 0,
      reservations_expired: 0,
      fines_applied: 0,
      errors: [] as string[],
    };

    for (const reservation of (reservations as Reservation[]) || []) {
      try {
        // Get user email
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(reservation.user_id);
        if (authError || !authUser?.user?.email) {
          console.error(`Could not get email for user ${reservation.user_id}:`, authError);
          continue;
        }

        const userEmail = authUser.user.email;

        // Get user profile for name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", reservation.user_id)
          .maybeSingle();

        const userName = (profile as Profile)?.full_name || "Valued Customer";

        // Parse times
        const endTimeParts = reservation.end_time.split(":");
        const endDateTime = new Date(now);
        endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);

        const startTimeParts = reservation.start_time.split(":");
        const startDateTime = new Date(now);
        startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0, 0);

        const minutesUntilEnd = Math.floor((endDateTime.getTime() - now.getTime()) / 60000);
        const minutesSinceStart = Math.floor((now.getTime() - startDateTime.getTime()) / 60000);

        console.log(`Reservation ${reservation.id}: end in ${minutesUntilEnd} mins, started ${minutesSinceStart} mins ago`);

        // Check if reservation has expired (15 min grace period after start, no check-in)
        if (minutesSinceStart > 15 && !reservation.checked_in_at && !reservation.fine_applied) {
          console.log(`Marking reservation ${reservation.id} as expired (no show)`);
          
          // Mark as expired
          await supabase
            .from("reservations")
            .update({ status: "expired", fine_applied: true })
            .eq("id", reservation.id);

          // Calculate fine (50% of reservation amount)
          const fineAmount = Math.round(reservation.amount * 0.5);

          // Create fine
          const { error: fineError } = await supabase
            .from("user_fines")
            .insert({
              user_id: reservation.user_id,
              reservation_id: reservation.id,
              amount: fineAmount,
              reason: `No-show for reservation at ${reservation.parking_lots?.name || "parking lot"}`,
              status: "pending",
            });

          if (fineError) {
            console.error("Error creating fine:", fineError);
            results.errors.push(`Failed to create fine for reservation ${reservation.id}`);
          } else {
            results.fines_applied++;
            
            // Send fine notification email
            await resend.emails.send({
              from: "NigamPark <onboarding@resend.dev>",
              to: [userEmail],
              subject: "Reservation Expired - Fine Applied",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #dc2626;">Reservation Expired</h1>
                  <p>Dear ${userName},</p>
                  <p>Your parking reservation has expired as you did not check in within the 15-minute grace period.</p>
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Reservation Details:</strong></p>
                    <p style="margin: 5px 0;">Location: ${reservation.parking_lots?.name || "N/A"}</p>
                    <p style="margin: 5px 0;">Vehicle: ${reservation.vehicle_number}</p>
                    <p style="margin: 5px 0;">Scheduled Time: ${reservation.start_time} - ${reservation.end_time}</p>
                  </div>
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Fine Applied: ₹${fineAmount}</strong></p>
                    <p style="margin: 5px 0; font-size: 14px;">This fine will be added to your next parking transaction.</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">Please ensure timely arrival for future reservations to avoid fines.</p>
                  <p>Best regards,<br>NigamPark Team</p>
                </div>
              `,
            });
          }

          results.reservations_expired++;
          continue;
        }

        // Send 30-minute warning email
        if (minutesUntilEnd <= 30 && minutesUntilEnd > 15 && !reservation.notification_30_sent) {
          console.log(`Sending 30-minute warning for reservation ${reservation.id}`);
          
          await resend.emails.send({
            from: "NigamPark <onboarding@resend.dev>",
            to: [userEmail],
            subject: "Parking Reservation Expiring in 30 Minutes",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #f59e0b;">⏰ Reservation Expiring Soon</h1>
                <p>Dear ${userName},</p>
                <p>Your parking reservation will expire in <strong>30 minutes</strong>.</p>
                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Reservation Details:</strong></p>
                  <p style="margin: 5px 0;">Location: ${reservation.parking_lots?.name || "N/A"} (${reservation.parking_lots?.zone || ""})</p>
                  <p style="margin: 5px 0;">Vehicle: ${reservation.vehicle_number}</p>
                  <p style="margin: 5px 0;">Ends at: ${reservation.end_time}</p>
                </div>
                <p>Please ensure you exit the parking lot before your reservation expires to avoid any inconvenience.</p>
                <p>Best regards,<br>NigamPark Team</p>
              </div>
            `,
          });

          await supabase
            .from("reservations")
            .update({ notification_30_sent: true })
            .eq("id", reservation.id);

          results.notifications_sent++;
        }

        // Send 15-minute warning email
        if (minutesUntilEnd <= 15 && minutesUntilEnd > 0 && !reservation.notification_15_sent) {
          console.log(`Sending 15-minute warning for reservation ${reservation.id}`);
          
          await resend.emails.send({
            from: "NigamPark <onboarding@resend.dev>",
            to: [userEmail],
            subject: "⚠️ Parking Reservation Expiring in 15 Minutes!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #dc2626;">⚠️ Urgent: Reservation Expiring!</h1>
                <p>Dear ${userName},</p>
                <p>Your parking reservation will expire in <strong>15 minutes</strong>!</p>
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Reservation Details:</strong></p>
                  <p style="margin: 5px 0;">Location: ${reservation.parking_lots?.name || "N/A"} (${reservation.parking_lots?.zone || ""})</p>
                  <p style="margin: 5px 0;">Vehicle: ${reservation.vehicle_number}</p>
                  <p style="margin: 5px 0;">Ends at: ${reservation.end_time}</p>
                </div>
                <p style="color: #dc2626; font-weight: bold;">Please exit the parking lot immediately to avoid overstay charges.</p>
                <p>Best regards,<br>NigamPark Team</p>
              </div>
            `,
          });

          await supabase
            .from("reservations")
            .update({ notification_15_sent: true })
            .eq("id", reservation.id);

          results.notifications_sent++;
        }
      } catch (resError) {
        console.error(`Error processing reservation ${reservation.id}:`, resError);
        results.errors.push(`Error processing reservation ${reservation.id}: ${resError}`);
      }
    }

    console.log("Reservation check complete:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-reservation-expiry:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
