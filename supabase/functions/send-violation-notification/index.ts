import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ViolationNotificationRequest {
  violation_id: string;
  new_status: string;
  admin_notes?: string;
}

const STATUS_MESSAGES: Record<string, { subject: string; message: string }> = {
  reviewing: {
    subject: "Your Violation Report is Being Reviewed",
    message: "Our team is currently reviewing your submitted violation report. We will update you once a decision has been made.",
  },
  resolved: {
    subject: "Your Violation Report Has Been Resolved",
    message: "Thank you for your report. The violation has been addressed and appropriate action has been taken.",
  },
  rejected: {
    subject: "Update on Your Violation Report",
    message: "After careful review, we were unable to verify the reported violation. Please ensure future reports include clear photo evidence.",
  },
  action_taken: {
    subject: "Action Taken on Your Violation Report",
    message: "Based on your report, we have issued a fine to the violating vehicle. Thank you for helping maintain parking discipline.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { violation_id, new_status, admin_notes }: ViolationNotificationRequest = await req.json();

    console.log(`Processing notification for violation ${violation_id}, status: ${new_status}`);

    // Get violation details with reporter info
    const { data: violation, error: violationError } = await supabase
      .from("violation_reports")
      .select("*, parking_lots(name)")
      .eq("id", violation_id)
      .single();

    if (violationError || !violation) {
      throw new Error(`Violation not found: ${violationError?.message}`);
    }

    // Get reporter's profile and preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", violation.reporter_id)
      .single();

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("email_notifications, sms_notifications")
      .eq("user_id", violation.reporter_id)
      .single();

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(violation.reporter_id);
    const userEmail = authUser?.user?.email;

    const statusInfo = STATUS_MESSAGES[new_status] || {
      subject: "Update on Your Violation Report",
      message: `Your violation report status has been updated to: ${new_status}`,
    };

    const results = { email: null as any, sms: null as any };

    // Send email notification
    if (resendApiKey && userEmail && (preferences?.email_notifications !== false)) {
      try {
        const resend = new Resend(resendApiKey);
        const emailResult = await resend.emails.send({
          from: "NigamPark <onboarding@resend.dev>",
          to: [userEmail],
          subject: statusInfo.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a365d; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">NigamPark</h1>
                <p style="margin: 5px 0 0;">Violation Report Update</p>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <p>Dear ${profile?.full_name || "Citizen"},</p>
                <p>${statusInfo.message}</p>
                ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ""}
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${violation.vehicle_number}</p>
                  <p style="margin: 5px 0;"><strong>Violation Type:</strong> ${violation.violation_type.replace(/_/g, " ")}</p>
                  <p style="margin: 5px 0;"><strong>Location:</strong> ${violation.parking_lots?.name || violation.location || "N/A"}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${new_status === 'resolved' ? 'green' : new_status === 'rejected' ? 'red' : 'orange'};">${new_status.toUpperCase()}</span></p>
                </div>
                <p>Thank you for helping keep our parking areas safe.</p>
                <p style="color: #666; font-size: 12px;">This is an automated message from NigamPark.</p>
              </div>
            </div>
          `,
        });
        results.email = emailResult;
        console.log("Email sent successfully:", emailResult);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    // Send SMS notification
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && profile?.phone && preferences?.sms_notifications) {
      try {
        const formattedPhone = profile.phone.startsWith("+") ? profile.phone : `+91${profile.phone.replace(/\D/g, "")}`;
        const smsMessage = `NigamPark: ${statusInfo.subject}\n\nVehicle: ${violation.vehicle_number}\nStatus: ${new_status.toUpperCase()}\n\n${statusInfo.message.substring(0, 100)}...`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const smsResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: twilioPhoneNumber,
            Body: smsMessage,
          }),
        });

        results.sms = await smsResponse.json();
        console.log("SMS sent successfully:", results.sms);
      } catch (smsError) {
        console.error("Failed to send SMS:", smsError);
      }
    }

    // Log the notification
    await supabase.from("notification_logs").insert({
      user_id: violation.reporter_id,
      notification_type: "violation_status",
      recipient: userEmail || profile?.phone || "unknown",
      message: statusInfo.message,
      status: results.email || results.sms ? "sent" : "failed",
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-violation-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
