import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  phone: string;
  message: string;
  type: 'sms' | 'whatsapp';
  user_id?: string;
  reservation_id?: string;
  demo_mode?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone, message, type, user_id, reservation_id, demo_mode }: NotificationRequest = await req.json();

    if (!phone || !message) {
      throw new Error("Phone and message are required");
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    console.log(`Sending ${type} to ${formattedPhone}: ${message.substring(0, 50)}...`);

    // Check if demo mode is enabled (either explicitly or via missing Twilio credentials)
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    const isDemoMode = demo_mode || !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber;

    // Log the notification attempt
    const { data: notificationLog, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        user_id,
        reservation_id,
        notification_type: isDemoMode ? `${type}_demo` : type,
        recipient: formattedPhone,
        message,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    // Demo mode - simulate sending without actually calling Twilio
    if (isDemoMode) {
      console.log("📱 DEMO MODE - Message logged but not sent:");
      console.log("━".repeat(50));
      console.log(`📞 To: ${formattedPhone}`);
      console.log(`📝 Type: ${type.toUpperCase()}`);
      console.log(`💬 Message:\n${message}`);
      console.log("━".repeat(50));

      // Update notification log with demo success
      if (notificationLog) {
        await supabase
          .from('notification_logs')
          .update({
            status: 'demo_sent',
            external_id: `demo_${Date.now()}`,
            sent_at: new Date().toISOString(),
          })
          .eq('id', notificationLog.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          demo_mode: true,
          message: 'Message logged in demo mode (not actually sent)',
          sid: `demo_${Date.now()}`,
          recipient: formattedPhone,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Production mode - send via Twilio
    let endpoint: string;
    let body: URLSearchParams;

    if (type === 'whatsapp') {
      // WhatsApp via Twilio
      endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      body = new URLSearchParams({
        To: `whatsapp:${formattedPhone}`,
        From: `whatsapp:${twilioPhoneNumber}`,
        Body: message,
      });
    } else {
      // SMS via Twilio
      endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      body = new URLSearchParams({
        To: formattedPhone,
        From: twilioPhoneNumber,
        Body: message,
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      
      // Update notification log with error
      if (notificationLog) {
        await supabase
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: result.message || 'Unknown error',
          })
          .eq('id', notificationLog.id);
      }

      // Provide user-friendly error for trial account limitation
      if (result.code === 21608) {
        throw new Error('SMS service is in trial mode. The recipient phone number must be verified in Twilio console, or upgrade to a paid Twilio account.');
      }

      throw new Error(result.message || 'Failed to send notification');
    }

    console.log("Notification sent successfully:", result.sid);

    // Update notification log with success
    if (notificationLog) {
      await supabase
        .from('notification_logs')
        .update({
          status: 'sent',
          external_id: result.sid,
          sent_at: new Date().toISOString(),
        })
        .eq('id', notificationLog.id);
    }

    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-sms-notification:", errorMessage);
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
