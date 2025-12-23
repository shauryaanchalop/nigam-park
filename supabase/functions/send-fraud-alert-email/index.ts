import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FraudAlertEmailRequest {
  alertId: string;
  severity: string;
  location: string;
  description: string;
  recipientEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const { alertId, severity, location, description, recipientEmail }: FraudAlertEmailRequest = await req.json();

    console.log(`Processing fraud alert email for alert: ${alertId}, severity: ${severity}`);

    // Use configured admin email from secrets, fallback to provided email or default
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const toEmail = recipientEmail || adminEmail || "admin@nigampark.gov.in";
    
    console.log(`Sending fraud alert to: ${toEmail}`);

    const severityColors: Record<string, string> = {
      CRITICAL: "#dc2626",
      HIGH: "#f59e0b",
      MEDIUM: "#3b82f6",
      LOW: "#22c55e",
    };

    const severityColor = severityColors[severity] || "#6b7280";
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const emailResponse = await resend.emails.send({
      from: "NIGAM-Park Alerts <onboarding@resend.dev>",
      to: [toEmail],
      subject: `🚨 ${severity} FRAUD ALERT - ${location}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ NIGAM-Park</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">AI-Powered Fraud Detection System</p>
            </div>
            
            <!-- Alert Banner -->
            <div style="background-color: ${severityColor}; padding: 16px; text-align: center;">
              <span style="color: white; font-weight: bold; font-size: 18px; text-transform: uppercase;">
                ${severity} FRAUD ALERT
              </span>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
              <div style="margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
                <p style="color: #111827; font-size: 16px; margin: 0; font-weight: 600;">${location}</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Description</p>
                <p style="color: #111827; font-size: 16px; margin: 0;">${description}</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Alert ID</p>
                <p style="color: #111827; font-size: 14px; margin: 0; font-family: monospace;">${alertId}</p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Timestamp</p>
                <p style="color: #111827; font-size: 14px; margin: 0;">${timestamp}</p>
              </div>
              
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  <strong>⚠️ Immediate Action Required</strong><br>
                  Please investigate this alert and take appropriate action to prevent revenue leakage.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Municipal Corporation of Delhi - NIGAM-Park Revenue Assurance System
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending fraud alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
