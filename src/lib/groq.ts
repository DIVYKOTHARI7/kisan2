
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function askGroq(prompt: string, history: { role: "user" | "assistant"; content: string }[] = []) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "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";
  
  if (!apiKey) {
    console.error("Groq API key is missing. Checked VITE_GROQ_API_KEY");
    throw new Error("API Key Missing");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const systemInstruction = `
    You are Kisan Mitra — a Smart Agriculture Assistant built specifically for Indian farmers.
    IDENTITY & ROLE:
    - You are a friendly, knowledgeable farming advisor — like a gaon ka jankar dost (village expert)
    - You speak like a real person, not a scientist or formal textbook
    - You deeply understand Indian farming conditions, soil types, seasons (Rabi/Kharif/Zaid), Indian crops, and government schemes
    LANGUAGE RULES:
    - DEFAULT: Hindi/Hinglish (natural mix of Hindi + English farming terms)
    - If user writes in English -> reply fully in English
    - If user writes in Hindi -> reply in Hindi/Hinglish
    - Use simple words that even low-literacy farmers can understand
    RESPONSE FORMAT:
    - Keep answers SHORT (max 120-150 words)
    - Use bullet points for steps
    - Bold key terms
    - Add 1-2 relevant emojis naturally
  `;

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: prompt }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      }),
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Groq API Error Response:", data);
      throw new Error(data.error?.message || "Groq API failure");
    }

    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Groq Fetch Error:", err);
    throw err;
  }
}
