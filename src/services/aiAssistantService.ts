export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function getStoredGeminiKey(): string {
  return (
    localStorage.getItem('nigam_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  );
}

export const SYSTEM_PROMPT = (userRole: string, language: string = 'en') => {
  const base = `You are the official NIGAM-Park AI Assistant for the Municipal Corporation of Delhi (MCD) Smart Parking initiative in New Delhi, India.
Always maintain a polite, helpful, and professional tone.
Respond in the language requested (English or Hindi/Hinglish).

Core System Information:
- Managed by: Municipal Corporation of Delhi (MCD).
- Major Parking Zones in Delhi:
  * Connaught Place Block A (New Delhi - 200 capacity, ₹40/hr, EV Charging & Covered, near Rajiv Chowk Metro)
  * Karol Bagh Market (Central Delhi - 150 capacity, ₹30/hr, near Karol Bagh Metro)
  * Chandni Chowk Metro (Old Delhi - 80 capacity, ₹20/hr, Multi-level automated, near Chandni Chowk Metro)
  * Lajpat Nagar Central (South Delhi - 120 capacity, ₹30/hr, near Lajpat Nagar Metro)
  * Nehru Place IT Hub (South-East Delhi - 180 capacity, ₹40/hr, EV Charging, near Nehru Place Metro)
  * Sarojini Nagar Market (South-West Delhi - 100 capacity, ₹20/hr, Covered, near Sarojini Nagar Metro)
- Features: Real-time slot reservation, FASTag touchless auto-debit, UPI QR payment, ANPR Camera OCR detection, Overstay fine calculation (₹10 per 15 min), Loyalty points, Monthly passes, Fleet management.
- Citizen Helpline: 1800-11-PARK (1800-11-7275) or support@nigampark.delhi.gov.in.`;

  switch (userRole) {
    case 'admin':
      return `${base}
You are currently assisting an MCD Commissioner / Parking Administrator.
Help them with:
- Zone revenue analytics and collection trends
- Live occupancy surveillance and leakages
- Surge pricing rule configuration and dynamic demand multipliers
- Attendant shift monitoring and vigilance flags
- High-priority fraud pattern detections and ANPR blacklist events.`;

    case 'attendant':
      return `${base}
You are currently assisting a Ground Parking Attendant at an MCD POS Booth.
Help them with:
- Check-in and check-out procedures for 2-wheelers and 4-wheelers
- Handling cash, UPI QR, and FASTag scans
- Overstay calculations and resolving disputed tickets
- Emergency vehicle priority overrides and towing escalations.`;

    case 'citizen':
    default:
      return `${base}
You are currently assisting a Citizen / Delhi Motorist.
Help them with:
- Finding closest parking lots with available vacant spots in Delhi
- Booking advanced slot reservations
- Fast UPI and FASTag wallet payments
- Contesting wrongful fines and understanding overstay grace periods
- Metro connectivity and EV charging station reservations.`;
  }
};

export async function streamChatResponse(
  messages: ChatMessage[],
  userRole: string = 'citizen',
  language: string = 'en',
  onChunk: (chunk: string) => void
): Promise<string> {
  const apiKey = getStoredGeminiKey();

  const systemInstruction = SYSTEM_PROMPT(userRole, language);

  // Convert conversation to Gemini contents format
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const model = 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No streaming response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const textChunk =
              parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textChunk) {
              accumulatedText += textChunk;
              onChunk(accumulatedText);
            }
          } catch {
            // Incomplete JSON chunk, skip
          }
        }
      }
    }

    if (accumulatedText) {
      return accumulatedText;
    }
  } catch (err) {
    console.warn('Gemini stream failed, falling back to non-streaming or local response:', err);
  }

  // Non-streaming fallback
  try {
    const nonStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(nonStreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        onChunk(text);
        return text;
      }
    }
  } catch (err) {
    console.error('Direct fallback also failed:', err);
  }

  // Smart local offline response if network/key issues occur
  const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  let fallbackReply = `Namaste! I am your NIGAM-Park Assistant. All 6 MCD parking facilities (Connaught Place, Karol Bagh, Chandni Chowk, Lajpat Nagar, Nehru Place, and Sarojini Nagar) are operating normally. You can reserve slots, pay via UPI/FASTag, or check live occupancy directly on the portal.`;

  if (lastUserMsg.includes('connaught') || lastUserMsg.includes('cp')) {
    fallbackReply = `Connaught Place Block A lot has 44 available slots right now at ₹40/hr. It includes EV charging stations and is a 2-minute walk from Rajiv Chowk Metro Gate 7.`;
  } else if (lastUserMsg.includes('fine') || lastUserMsg.includes('overstay')) {
    fallbackReply = `Overstay fines in NIGAM-Park are calculated at ₹10 per 15 minutes past your reserved exit time. You can view or contest pending fines from the "Fines & Violations" tab.`;
  } else if (lastUserMsg.includes('rate') || lastUserMsg.includes('price')) {
    fallbackReply = `MCD standard parking rates range from ₹20/hr to ₹40/hr depending on the zone. Peak-hour dynamic surge pricing applies during 5 PM - 8 PM in high-traffic shopping districts.`;
  }

  onChunk(fallbackReply);
  return fallbackReply;
}
