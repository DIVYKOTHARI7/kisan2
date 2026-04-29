// Edge function: AI-powered crop recommendation via Lovable AI Gateway (Gemini)
// Returns 3 ranked crops with match score, yield, profit, risk, and tips.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RecInput = {
  n: number;
  p: number;
  k: number;
  ph: number;
  soilType: string;
  season: string;
  irrigation: string;
  budget: number;
  risk: "low" | "medium" | "high";
  state?: string | null;
  village?: string | null;
  pincode?: string | null;
  language?: string | null;
};

const tools = [
  {
    type: "function",
    function: {
      name: "return_recommendations",
      description:
        "Return exactly 3 crop recommendations ranked by best fit (highest match first).",
      parameters: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                crop: { type: "string", description: "Crop name in English (e.g. Wheat, Mustard)" },
                emoji: { type: "string", description: "Single emoji representing the crop" },
                matchScore: {
                  type: "integer",
                  minimum: 50,
                  maximum: 99,
                  description: "How well this crop matches the inputs (0-99)",
                },
                expectedYield: {
                  type: "string",
                  description: "Expected yield with unit, e.g. '35-40 quintal/acre'",
                },
                expectedProfit: {
                  type: "integer",
                  description: "Expected profit per acre in INR (rupees)",
                },
                riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                reason: {
                  type: "string",
                  description:
                    "1-2 sentences explaining why this crop fits the soil/season/region. In farmer's language if non-English requested.",
                },
                tips: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string" },
                  description: "3 short actionable cultivation tips",
                },
              },
              required: [
                "crop",
                "emoji",
                "matchScore",
                "expectedYield",
                "expectedProfit",
                "riskLevel",
                "reason",
                "tips",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["recommendations"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as RecInput;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lang = input.language && input.language !== "en"
      ? `Reason text MUST be written in language code '${input.language}' (Devanagari/Gurmukhi/Telugu script as appropriate). Crop names stay in English.`
      : "Write reason in clear simple English.";

    const location = [input.village, input.state, input.pincode]
      .filter(Boolean)
      .join(", ") || "India";

    const systemPrompt = `You are KrishiSathi AI — an expert Indian agronomist.
Given a farmer's soil profile, location, season, irrigation, budget and risk appetite,
recommend the 3 BEST crops to grow. Use realistic Indian mandi-based profit estimates
(₹ per acre), realistic yield ranges, and conservative risk assessment.
Consider regional crop suitability for the given state. ${lang}
Always call the return_recommendations function — do NOT reply with prose.`;

    const userPrompt = `Soil: N=${input.n} kg/ha, P=${input.p} kg/ha, K=${input.k} kg/ha, pH=${input.ph}, type=${input.soilType}
Location: ${location}
Season: ${input.season}
Irrigation: ${input.irrigation}
Budget: ₹${input.budget}/acre
Risk appetite: ${input.risk}

Recommend 3 crops ranked best-fit first.`;

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools,
          tool_choice: {
            type: "function",
            function: { name: "return_recommendations" },
          },
        }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      console.error("AI gateway error:", res.status, txt);
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded — try again in a minute." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted — please top up workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return structured recommendations." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crop-recommend error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
