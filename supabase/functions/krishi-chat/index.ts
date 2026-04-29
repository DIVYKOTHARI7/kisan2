// Krishi AI chat — streams from Lovable AI Gateway (Gemini).
// Multilingual: Hindi / English / Hinglish / regional.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Msg = { role: "user" | "assistant" | "system"; content: string };

type Profile = {
  name?: string | null;
  village?: string | null;
  state?: string | null;
  land_acres?: number | null;
  soil_type?: string | null;
  primary_crops?: string[] | null;
  preferred_language?: string | null;
};

function buildSystemPrompt(profile?: Profile) {
  const lang = profile?.preferred_language ?? "en";
  const langInstruction =
    lang === "hi"
      ? "Reply in conversational Hindi (Devanagari script) by default. Switch language if the user does."
      : lang === "mr"
      ? "Reply in conversational Marathi by default. Switch if user does."
      : lang === "pa"
      ? "Reply in conversational Punjabi (Gurmukhi) by default. Switch if user does."
      : lang === "te"
      ? "Reply in conversational Telugu by default. Switch if user does."
      : "Detect the user's language (English, Hindi, Hinglish, regional) and reply in the same.";

  const farmerCtx = profile
    ? `\n\nFarmer context:\n- Name: ${profile.name ?? "unknown"}\n- Location: ${profile.village ?? "?"}, ${profile.state ?? "?"}\n- Land: ${profile.land_acres ?? "?"} acres\n- Soil: ${profile.soil_type ?? "?"}\n- Primary crops: ${(profile.primary_crops ?? []).join(", ") || "?"}`
    : "";

  return `You are **Krishi AI**, KrishiSathi's expert agricultural assistant for Indian farmers. ${langInstruction}

Be warm, concise, and actionable. Use simple farmer-friendly language — avoid jargon.

When relevant, mention:
- Practical steps (what to do today, this week, this season)
- Cost estimates in ₹ (per acre when relevant)
- Government schemes (PM-KISAN, PMFBY, Soil Health Card, KCC) with brief eligibility notes
- Weather considerations for India
- Organic & chemical alternatives where applicable

Format with short paragraphs, **bold** key terms, and bullet lists when helpful. Keep responses under 200 words unless the question requires depth.${farmerCtx}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, profile } = (await req.json()) as { messages: Msg[]; profile?: Profile };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
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
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: buildSystemPrompt(profile) }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests — please wait a minute and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add funds in Settings → Workspace → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("krishi-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
