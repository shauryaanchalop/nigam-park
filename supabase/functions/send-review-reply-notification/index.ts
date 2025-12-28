import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewReplyNotificationRequest {
  review_id: string;
  reply_text: string;
  lot_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Review reply notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { review_id, reply_text, lot_name }: ReviewReplyNotificationRequest = await req.json();
    
    console.log(`Processing notification for review: ${review_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the review and user details
    const { data: review, error: reviewError } = await supabase
      .from('parking_reviews')
      .select('user_id, rating, review_text')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      console.error('Review not found:', reviewError);
      return new Response(
        JSON.stringify({ error: 'Review not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(review.user_id);

    if (userError || !userData?.user?.email) {
      console.error('User not found or no email:', userError);
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending notification to: ${userEmail}`);

    // Send email notification via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NIGAM-Park <onboarding@resend.dev>",
        to: [userEmail],
        subject: `Management Response to Your Review - ${lot_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .review-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
              .reply-box { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .stars { color: #fbbf24; font-size: 18px; }
              .badge { display: inline-block; background: #1e40af; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🅿️ NIGAM-Park</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Smart Parking System - Delhi</p>
              </div>
              <div class="content">
                <h2>The management has responded to your review!</h2>
                <p>Hi there,</p>
                <p>The parking management team at <strong>${lot_name}</strong> has responded to your review.</p>
                
                <div class="review-box">
                  <p style="margin: 0 0 10px 0; font-weight: 600;">Your Review:</p>
                  <p class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
                  <p style="margin: 0; color: #6b7280;">${review.review_text || '(No text provided)'}</p>
                </div>
                
                <div class="reply-box">
                  <p style="margin: 0 0 10px 0; font-weight: 600;">
                    <span class="badge">Management Response</span>
                  </p>
                  <p style="margin: 0;">${reply_text}</p>
                </div>
                
                <p>We appreciate your feedback and hope to serve you better!</p>
                <p>— The NIGAM-Park Team</p>
              </div>
              <div class="footer">
                <p>Municipal Corporation of Delhi | Smart Parking Initiative</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent', data: emailData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-review-reply-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);