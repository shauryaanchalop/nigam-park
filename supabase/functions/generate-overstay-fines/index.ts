import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Overstay rate: ₹10 per 15 minutes
const OVERSTAY_RATE_PER_15MIN = 10;

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

    console.log(`[${now.toISOString()}] Running overstay fine generation...`);

    // Find active reservations that have exceeded their end time
    const { data: overstayReservations, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        parking_lots (name, zone, hourly_rate)
      `)
      .eq("reservation_date", today)
      .eq("status", "confirmed")
      .not("checked_in_at", "is", null);

    if (fetchError) {
      console.error("Error fetching reservations:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${overstayReservations?.length || 0} active reservations to check`);

    const results = {
      fines_created: 0,
      overstay_alerts_created: 0,
      emails_sent: 0,
      errors: [] as string[],
    };

    for (const reservation of overstayReservations || []) {
      try {
        // Parse end time
        const endTimeParts = reservation.end_time.split(":");
        const endDateTime = new Date(now);
        endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);

        const overstayMinutes = Math.floor((now.getTime() - endDateTime.getTime()) / 60000);

        // Only process if actually overstaying (more than 5 min grace period)
        if (overstayMinutes <= 5) continue;

        console.log(`Reservation ${reservation.id} is overstaying by ${overstayMinutes} minutes`);

        // Check if an overstay alert already exists
        const { data: existingAlert } = await supabase
          .from("overstay_alerts")
          .select("id")
          .eq("lot_id", reservation.lot_id)
          .eq("vehicle_number", reservation.vehicle_number)
          .eq("status", "active")
          .maybeSingle();

        if (!existingAlert) {
          // Create overstay alert
          const { error: alertError } = await supabase
            .from("overstay_alerts")
            .insert({
              lot_id: reservation.lot_id,
              vehicle_number: reservation.vehicle_number,
              entry_time: reservation.checked_in_at,
              expected_exit_time: endDateTime.toISOString(),
              overstay_minutes: overstayMinutes,
              status: "active",
            });

          if (!alertError) {
            results.overstay_alerts_created++;
          }
        } else {
          // Update existing alert with current overstay minutes
          await supabase
            .from("overstay_alerts")
            .update({ overstay_minutes: overstayMinutes })
            .eq("id", existingAlert.id);
        }

        // Calculate fine (₹10 per 15 min block)
        const blocks = Math.ceil(overstayMinutes / 15);
        const fineAmount = blocks * OVERSTAY_RATE_PER_15MIN;

        // Check if fine already exists for this reservation
        const { data: existingFine } = await supabase
          .from("user_fines")
          .select("id, amount")
          .eq("reservation_id", reservation.id)
          .eq("status", "pending")
          .eq("reason", "Overstay fine")
          .maybeSingle();

        if (!existingFine) {
          // Create new fine
          const { error: fineError } = await supabase
            .from("user_fines")
            .insert({
              user_id: reservation.user_id,
              reservation_id: reservation.id,
              amount: fineAmount,
              reason: "Overstay fine",
              status: "pending",
            });

          if (!fineError) {
            results.fines_created++;

            // Get user email and send notification
            const { data: authUser } = await supabase.auth.admin.getUserById(reservation.user_id);
            if (authUser?.user?.email) {
              try {
                await resend.emails.send({
                  from: "NigamPark <onboarding@resend.dev>",
                  to: [authUser.user.email],
                  subject: "⚠️ Overstay Fine Applied",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h1 style="color: #dc2626;">⚠️ Overstay Fine Applied</h1>
                      <p>Your vehicle has exceeded the reserved parking time.</p>
                      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Vehicle:</strong> ${reservation.vehicle_number}</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> ${reservation.parking_lots?.name || "N/A"}</p>
                        <p style="margin: 5px 0;"><strong>Reserved Until:</strong> ${reservation.end_time}</p>
                        <p style="margin: 5px 0;"><strong>Overstay:</strong> ${overstayMinutes} minutes</p>
                      </div>
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px;"><strong>Current Fine: ₹${fineAmount}</strong></p>
                        <p style="margin: 5px 0; font-size: 14px;">Fine increases by ₹${OVERSTAY_RATE_PER_15MIN} every 15 minutes</p>
                      </div>
                      <p style="color: #dc2626; font-weight: bold;">Please exit the parking lot immediately to avoid additional charges.</p>
                      <p>Best regards,<br>NigamPark Team</p>
                    </div>
                  `,
                });
                results.emails_sent++;
              } catch (emailError) {
                console.error("Error sending email:", emailError);
              }
            }
          }
        } else if (existingFine.amount !== fineAmount) {
          // Update existing fine amount
          await supabase
            .from("user_fines")
            .update({ amount: fineAmount })
            .eq("id", existingFine.id);
        }
      } catch (resError) {
        console.error(`Error processing reservation ${reservation.id}:`, resError);
        results.errors.push(`Error processing reservation ${reservation.id}`);
      }
    }

    console.log("Overstay check complete:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in generate-overstay-fines:", errorMessage);
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
