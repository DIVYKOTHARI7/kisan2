import httpx
import json
from app.config import settings
from app.schemas.crop import CropRecommendationInput, CropRecommendationResponse, CropRecommendationResult

async def call_gemini(prompt: str) -> str:
    if not settings.GEMINI_API_KEY:
        return ""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=30.0)
            if resp.status_code != 200:
                print(f"Gemini API Error: {resp.status_code} - {resp.text}")
                return ""
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini request exception: {e}")
        return ""

async def call_groq(prompt: str) -> str:
    if not settings.GROQ_API_KEY:
        return ""
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are an agricultural scientist specialized in Indian farming. Respond ONLY with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=30.0)
            if resp.status_code != 200:
                print(f"Groq API Error: {resp.status_code} - {resp.text}")
                return ""
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Groq request exception: {e}")
        return ""

def clean_json_response(reply: str) -> str:
    """Helper to extract JSON from AI response blocks"""
    json_str = reply
    if "```json" in reply:
        json_str = reply.split("```json")[1].split("```")[0]
    elif "```" in reply:
        json_str = reply.split("```")[1].split("```")[0]
    return json_str.strip()
async def get_crop_recommendations(data: CropRecommendationInput) -> CropRecommendationResponse:
    prompt = f"""
    Act as an agriculture scientist. Based on these soil/weather parameters, recommend top 3 crops for an Indian farmer.
    N: {data.n}, P: {data.p}, K: {data.k}, pH: {data.ph}, Soil: {data.soilType}, Season: {data.season}.
    Return ONLY a JSON array of objects with these keys: 
    crop (string), emoji (string), matchScore (int 0-100), expectedYield (string), expectedProfit (float), riskLevel (low/medium/high), reason (string), tips (list of strings).
    """

    reply = ""
    # Try Gemini first
    if settings.LLM_PROVIDER == "gemini":
        print("Attempting Gemini for crop recommendation...")
        reply = await call_gemini(prompt)
        
    # If Gemini fails, try Groq as fallback
    if not reply and settings.GROQ_API_KEY:
        print("Gemini failed or skipped. Attempting Groq fallback...")
        reply = await call_groq(prompt)

    if reply:
        try:
            clean_reply = clean_json_response(reply)
            recs_data = json.loads(clean_reply)
            recs = [CropRecommendationResult(**item) for item in recs_data]
            return CropRecommendationResponse(recommendations=recs)
        except Exception as e:
            print(f"Error parsing AI JSON response: {e}")
            print(f"Raw reply was: {reply}")

    # MOCK DATA FALLBACK
    recs = [
        CropRecommendationResult(
            crop="Wheat (Mock)",
            emoji="🌾",
            matchScore=94,
            expectedYield="35-40 quintal/acre",
            expectedProfit=42000.0,
            riskLevel="low",
            reason="Perfect for your soil pH 7.2, rabi season suits your area",
            tips=["Ensure proper irrigation at tillering stage", "Apply zinc sulfate if deficiency observed"]
        ),
        CropRecommendationResult(
            crop="Mustard (Mock)",
            emoji="🌼",
            matchScore=82,
            expectedYield="8-10 quintal/acre",
            expectedProfit=28000.0,
            riskLevel="medium",
            reason="Good alternative with lower water requirement",
            tips=["Watch out for aphids"]
        )
    ]
    return CropRecommendationResponse(recommendations=recs)

async def get_disease_detection(image_data: str = None) -> dict:
    if settings.LLM_PROVIDER == "gemini" and image_data:
        # In a real app, we'd send the image bytes to Gemini Vision
        # For now, we simulate a text-based analysis or use the mock
        pass
    
    return {
        "detections": [
            {
                "disease_name": "Leaf Blight (Bacterial)",
                "confidence": 94.2,
                "severity": "MEDIUM",
                "treatment_plan": [
                    {"step": 1, "description": "Remove infected leaves immediately"},
                    {"step": 2, "description": "Apply Copper Oxychloride 3g/L (spray)"},
                    {"step": 3, "description": "Avoid overhead irrigation"},
                    {"step": 4, "description": "Re-check after 7 days"}
                ],
                "estimated_cost": "₹800-1200/acre"
            }
        ]
    }
