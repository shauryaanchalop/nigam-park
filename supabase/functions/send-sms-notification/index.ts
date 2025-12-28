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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Twilio credentials not configured");
      throw new Error("SMS service not configured");
    }

    const { phone, message, type, user_id, reservation_id }: NotificationRequest = await req.json();

    if (!phone || !message) {
      throw new Error("Phone and message are required");
    }

    console.log(`Sending ${type} to ${phone}: ${message.substring(0, 50)}...`);

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    // Log the notification attempt
    const { data: notificationLog, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        user_id,
        reservation_id,
        notification_type: type,
        recipient: formattedPhone,
        message,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging notification:", logError);
    }

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
        throw new Error('SMS service is in trial mode. Please verify this phone number in the Twilio console or upgrade to a paid account to send messages to unverified numbers.');
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
