
const GEMINI_MODEL = "gemini-1.5-flash";

export async function askGemini(
  prompt: string, 
  history: { role: "user" | "model"; parts: { text: string }[] }[] = [],
  image?: { data: string; mimeType: string }
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    console.error("Gemini API key is missing.");
    throw new Error("API Key Missing");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const systemInstruction = `
    You are Kisan Mitra — a Smart Agriculture Assistant for Indian farmers.
    IDENTITY: Friendly farming advisor, "gaon ka jankar dost".
    LANGUAGE: Hindi/Hinglish by default. Simple words.
    RESPONSE: Short (max 150 words), bold key terms, use emojis.
    CORE: Suggest crops, fertilizer guidance (organic first), disease diagnosis (especially from images), weather advice, and govt schemes (PM-KISAN etc).
    IMAGE ANALYSIS: If an image is provided, analyze it for crop health, pests, or diseases and provide a solution.
  `;

  // Build the message parts
  const userParts: any[] = [{ text: prompt }];
  if (image) {
    userParts.push({
      inline_data: {
        mime_type: image.mimeType,
        data: image.data
      }
    });
  }

  const body = {
    system_instruction: {
      parts: { text: systemInstruction }
    },
    contents: [
      ...history,
      {
        role: "user",
        parts: userParts
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data.error?.message || "Gemini API failure");
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    console.error("Gemini Fetch Error:", err);
    throw err;
  }
}
