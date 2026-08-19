import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an ANPR (Automatic Number Plate Recognition) and object detection engine for a municipal smart-parking CCTV system.
Analyse the given camera frame and return ONLY a JSON object, no markdown, no explanation, with this exact shape:

{
  "plates": [{ "text": "DL01AB1234", "confidence": 0.0-1.0, "box": [x, y, w, h] }],
  "objects": [{ "label": "car", "confidence": 0.0-1.0, "box": [x, y, w, h] }],
  "summary": "one short sentence"
}

Rules:
- box values are NORMALISED floats between 0 and 1 relative to the image (x,y = top-left corner).
- "plates": every readable vehicle number plate. Transcribe exactly as seen, uppercase, no spaces. If unreadable, omit it.
- "objects": vehicles (car, motorcycle, truck, bus, auto-rickshaw, bicycle), people, and traffic-relevant objects. Max 12.
- If nothing is detected, return empty arrays.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image } = await req.json().catch(() => ({}));
    if (!image || typeof image !== "string" || !image.startsWith("data:image")) {
      return new Response(JSON.stringify({ error: "Missing image frame" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Detect number plates and objects in this CCTV frame." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      const status = response.status;
      const message =
        status === 429
          ? "Vision AI is rate limited. Try again in a few seconds."
          : status === 402
          ? "AI credits exhausted. Add credits to continue using Vision AI."
          : `Vision AI request failed (${status}).`;
      console.error("gateway error", status, detail);
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { plates: [], objects: [], summary: "No detections" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
