import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a high-precision ANPR (Automatic Number Plate Recognition) and object detection engine for a municipal smart-parking CCTV system in India.

Return ONLY a JSON object, no markdown, no explanation, with this exact shape:

{
  "plates": [{ "text": "DL01AB1234", "confidence": 0.0-1.0, "box": [x, y, w, h], "status": "CLEAR" | "OCCLUDED" | "BLOCKED", "note": "short reason if not CLEAR" }],
  "objects": [{ "label": "car", "confidence": 0.0-1.0, "box": [x, y, w, h], "status": "CLEAR" | "OCCLUDED" | "BLOCKED" }],
  "frame_quality": "GOOD" | "LOW_LIGHT" | "BLURRY" | "OBSTRUCTED",
  "summary": "one short sentence"
}

Box rules:
- box = [x, y, w, h] as NORMALISED floats 0..1 relative to the full image, where x,y is the TOP-LEFT corner and w,h are width/height. Never output pixel values.
- Boxes must tightly wrap the object. A plate box wraps only the plate rectangle, not the whole vehicle.

Plate reading rules (be extremely careful, accuracy matters more than quantity):
- Zoom mentally into each plate region and read character by character.
- Indian plates follow: 2 letters (state, e.g. DL, HR, UP, MH, KA) + 1-2 digits (RTO) + 1-3 letters (series) + 4 digits. BH-series: 2 digits + "BH" + 4 digits + 1-2 letters.
- Output UPPERCASE, no spaces, no hyphens, no state-name words.
- Resolve common OCR confusions using the position rule above: in LETTER positions prefer O over 0, I over 1, B over 8, S over 5, Z over 2, G over 6; in DIGIT positions prefer 0 over O/D/Q, 1 over I/L, 8 over B, 5 over S, 2 over Z, 6 over G.
- If the read does not match a valid Indian pattern, re-examine before emitting; lower the confidence accordingly.
- confidence must be honest: 0.95+ only for sharp, fully visible plates; 0.5-0.8 for partially readable; below 0.5 for guesses.
- status: "CLEAR" = fully visible and readable. "OCCLUDED" = partially hidden (dirt, glare, angle, another vehicle, cropped) — still output your best partial read, using "?" for characters you cannot resolve. "BLOCKED" = plate present but completely unreadable/covered — output text as "UNREADABLE" with the box, and explain in note.
- Never invent a plate that is not visibly present in the frame.

Object rules:
- "objects": vehicles (car, motorcycle, truck, bus, auto-rickshaw, bicycle), people, and traffic-relevant objects. Max 12, highest confidence first.
- Mark an object OCCLUDED when it is partially hidden or cut off by the frame edge, BLOCKED when it is mostly hidden behind something else.
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
