import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getSystemPrompt = (userRole: string) => {
  const baseInfo = `You are NIGAM-Park AI Assistant for the Municipal Corporation of Delhi's smart parking system.

Key information:
- Parking rates vary by location (typically ₹20-50/hour), with surge pricing during high demand
- Most lots operate 24/7
- Payment methods: UPI, Card, Cash
- Reservations can be cancelled up to 30 minutes before
- Overstay results in additional charges
- Helpline: 1800-XXX-XXXX

Respond in the same language the user writes in (Hindi or English). Be concise, helpful, and friendly.`;

  switch (userRole) {
    case 'admin':
      return `${baseInfo}

You are speaking with a NIGAM-Park ADMINISTRATOR. You can help them with:
1. Revenue analytics and insights - provide tips on increasing parking revenue
2. Managing parking lots and rates including surge pricing configuration
3. Attendant performance monitoring and shift scheduling
4. Fraud detection and security alerts analysis
5. User management and moderation
6. System configuration and settings
7. Generating reports and understanding KPIs
8. Handling escalated citizen complaints

Provide detailed, data-driven responses. You can suggest administrative actions like adjusting pricing, assigning staff, or reviewing alerts.`;

    case 'attendant':
      return `${baseInfo}

You are speaking with a PARKING ATTENDANT. You can help them with:
1. Vehicle check-in and check-out procedures
2. Handling payment transactions and POS operations
3. Resolving parking disputes with citizens
4. Reporting vehicle violations and overstays
5. Understanding their shift schedule
6. Checking their performance metrics
7. Emergency protocols and escalation procedures
8. Using the QR scanner and vehicle detection features

Provide practical, action-oriented guidance focused on their daily operations.`;

    case 'citizen':
    default:
      return `${baseInfo}

You are helping a CITIZEN user. You can help them with:
1. Finding available parking spots in Delhi (Connaught Place, Karol Bagh, Chandni Chowk, Lajpat Nagar, Nehru Place, Sarojini Nagar)
2. Understanding parking rates, surge pricing, and how to save money
3. Making reservations and checking availability
4. Payment issues and refund queries
5. Understanding fines, violations, and how to contest them
6. The loyalty program and earning/redeeming points
7. Monthly passes and business accounts
8. Reporting violations by other vehicles

Be friendly and focus on helping them save time and money while parking.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userRole = 'citizen' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Parking assistant request for role: ${userRole}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: getSystemPrompt(userRole) },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Parking assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
