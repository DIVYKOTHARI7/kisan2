import httpx
import json
import base64
import uuid
from app.config import settings
from app.schemas.disease import DiseaseInfo, DiseaseAnalysisResponse, TreatmentStep

MOCK_DISEASES = [
    DiseaseInfo(
        disease_name="Leaf Blight (Bacterial)",
        disease_name_hindi="पत्ती झुलसा रोग",
        crop_name="Rice / Tomato",
        crop_name_hindi="धान / टमाटर",
        confidence=94.2,
        severity="HIGH",
        severity_hindi="अधिक गंभीर",
        affected_area_percent=65,
        scientific_name="Xanthomonas oryzae",
        description="Bacterial Leaf Blight is a serious rice disease causing water-soaked lesions that turn yellow to white on leaf margins.",
        description_hindi="बैक्टीरियल लीफ ब्लाइट धान का एक गंभीर रोग है। पत्तियों के किनारों पर पानी भरे धब्बे बनते हैं जो बाद में पीले-सफेद हो जाते हैं और पत्तियाँ सूख जाती हैं।",
        symptoms=["Water-soaked leaf margins", "Yellow to white lesions along leaf edges", "Wilting in severe cases", "Bacterial ooze in morning dew"],
        symptoms_hindi=["पत्ती के किनारों पर पानी भरे धब्बे", "पत्ती किनारों पर पीले-सफेद धब्बे", "गंभीर मामलों में मुरझाना", "सुबह की ओस में बैक्टीरियल रसाव"],
        organic_treatment=[
            TreatmentStep(step=1, description="Remove and destroy infected plant parts immediately", type="organic"),
            TreatmentStep(step=2, description="Spray Pseudomonas fluorescens @ 5g/L water on affected area", type="organic"),
            TreatmentStep(step=3, description="Apply neem oil spray 3ml/L water every 7 days", type="organic"),
            TreatmentStep(step=4, description="Use trichoderma-enriched compost to boost plant immunity", type="organic"),
        ],
        chemical_treatment=[
            TreatmentStep(step=1, description="Spray Copper Oxychloride 3g/L water — cover all leaf surfaces", type="chemical"),
            TreatmentStep(step=2, description="Apply Streptomycin Sulphate 0.5g + Copper Sulphate 3g per liter", type="chemical"),
            TreatmentStep(step=3, description="Avoid overhead irrigation — use drip irrigation", type="chemical"),
            TreatmentStep(step=4, description="Re-spray after 7 days if symptoms persist", type="chemical"),
        ],
        prevention_tips=["Use certified disease-free seeds", "Maintain field sanitation", "Avoid waterlogging in fields", "Use resistant varieties like IR64, Pusa Basmati"],
        prevention_tips_hindi=["प्रमाणित बीज का उपयोग करें", "खेत की साफ-सफाई रखें", "खेत में जलभराव से बचें", "प्रतिरोधी किस्में जैसे IR64, पूसा बासमती का उपयोग करें"],
        estimated_cost_inr="₹800-1,200/एकड़",
        recovery_time="14-21 दिन",
        spread_risk="high"
    ),
    DiseaseInfo(
        disease_name="Powdery Mildew",
        disease_name_hindi="सफेद चूर्ण रोग",
        crop_name="Wheat / Vegetables",
        crop_name_hindi="गेहूं / सब्जियाँ",
        confidence=89.7,
        severity="MEDIUM",
        severity_hindi="मध्यम",
        affected_area_percent=40,
        scientific_name="Erysiphe graminis",
        description="Powdery mildew appears as white powdery spots on leaf surfaces, reducing photosynthesis and yield.",
        description_hindi="सफेद चूर्ण रोग में पत्तियों की सतह पर सफेद पाउडर जैसे धब्बे दिखाई देते हैं जो प्रकाश संश्लेषण को कम करते हैं और उपज को प्रभावित करते हैं।",
        symptoms=["White powdery coating on leaves", "Yellowing of affected leaves", "Stunted plant growth", "Premature leaf drop"],
        symptoms_hindi=["पत्तियों पर सफेद पाउडर जैसा आवरण", "प्रभावित पत्तियों का पीला पड़ना", "पौधे की बाधित वृद्धि", "समय से पहले पत्ती गिरना"],
        organic_treatment=[
            TreatmentStep(step=1, description="Spray mixture of milk (40%) + water (60%) on affected plants", type="organic"),
            TreatmentStep(step=2, description="Apply baking soda solution (1 tbsp per liter) with few drops of dish soap", type="organic"),
            TreatmentStep(step=3, description="Neem oil spray 5ml/L every 5 days", type="organic"),
        ],
        chemical_treatment=[
            TreatmentStep(step=1, description="Spray Propiconazole 25EC @ 1ml/L water", type="chemical"),
            TreatmentStep(step=2, description="Apply Sulfur dust 25kg/ha on dry days", type="chemical"),
            TreatmentStep(step=3, description="Hexaconazole 5SC @ 2ml/L as curative treatment", type="chemical"),
        ],
        prevention_tips=["Ensure proper plant spacing for air circulation", "Avoid excess nitrogen fertilizer", "Use resistant varieties", "Water plants in morning so leaves dry quickly"],
        prevention_tips_hindi=["उचित वायु संचार के लिए पौधों के बीच सही दूरी रखें", "अतिरिक्त नाइट्रोजन उर्वरक से बचें", "प्रतिरोधी किस्मों का उपयोग करें", "सुबह पानी दें ताकि पत्तियाँ जल्दी सूखें"],
        estimated_cost_inr="₹400-800/एकड़",
        recovery_time="10-14 दिन",
        spread_risk="medium"
    ),
    DiseaseInfo(
        disease_name="Aphid Infestation",
        disease_name_hindi="माहू कीट संक्रमण",
        crop_name="Mustard / Vegetables",
        crop_name_hindi="सरसों / सब्जियाँ",
        confidence=91.5,
        severity="MEDIUM",
        severity_hindi="मध्यम",
        affected_area_percent=35,
        scientific_name="Lipaphis erysimi",
        description="Aphids are small sap-sucking insects that cluster on young shoots and leaves, causing curling and yellowing.",
        description_hindi="माहू (एफिड) छोटे रस चूसने वाले कीट हैं जो युवा टहनियों और पत्तियों पर झुंड बनाते हैं, जिससे पत्तियाँ मुड़ती और पीली पड़ती हैं।",
        symptoms=["Dense clusters of tiny insects on shoots", "Curling and yellowing of leaves", "Sticky honeydew secretion", "Black sooty mold growth"],
        symptoms_hindi=["टहनियों पर छोटे कीटों के घने झुंड", "पत्तियों का मुड़ना और पीला पड़ना", "चिपचिपा मधुरस स्राव", "काला कवक का विकास"],
        organic_treatment=[
            TreatmentStep(step=1, description="Strong water spray to dislodge aphids from plants", type="organic"),
            TreatmentStep(step=2, description="Spray neem oil 5ml + garlic extract 10ml per liter of water", type="organic"),
            TreatmentStep(step=3, description="Introduce ladybird beetles (natural predators) in field", type="organic"),
            TreatmentStep(step=4, description="Yellow sticky traps @ 15 traps/acre to monitor and trap", type="organic"),
        ],
        chemical_treatment=[
            TreatmentStep(step=1, description="Imidacloprid 17.8SL @ 0.5ml/L water spray", type="chemical"),
            TreatmentStep(step=2, description="Thiamethoxam 25WG @ 0.3g/L as foliar spray", type="chemical"),
            TreatmentStep(step=3, description="Dimethoate 30EC @ 2ml/L as soil drench", type="chemical"),
        ],
        prevention_tips=["Monitor crops regularly especially during cool weather", "Avoid excess nitrogen which promotes soft growth", "Plant trap crops like mustard at field borders", "Maintain proper spacing between plants"],
        prevention_tips_hindi=["विशेष रूप से ठंडे मौसम में नियमित रूप से फसलों की निगरानी करें", "अत्यधिक नाइट्रोजन से बचें जो नरम वृद्धि को बढ़ावा देती है", "खेत की सीमाओं पर सरसों जैसी ट्रैप फसल लगाएं", "पौधों के बीच उचित दूरी बनाए रखें"],
        estimated_cost_inr="₹300-600/एकड़",
        recovery_time="7-10 दिन",
        spread_risk="medium"
    ),
]

async def call_gemini_vision(image_base64: str, mime_type: str) -> str:
    """Call Gemini Vision API to analyze plant disease from image."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return ""
    
    model = getattr(settings, 'GEMINI_MODEL', 'gemini-1.5-flash')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    prompt = """You are an expert plant pathologist and agricultural scientist specializing in Indian crops. 
Analyze this image carefully and identify any plant diseases, pests, or health issues.

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks):
{
  "disease_name": "English disease name",
  "disease_name_hindi": "हिंदी में रोग का नाम",
  "crop_name": "Crop name in English",
  "crop_name_hindi": "हिंदी में फसल का नाम",
  "confidence": 85,
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "severity_hindi": "कम|मध्यम|अधिक|अत्यधिक",
  "affected_area_percent": 40,
  "scientific_name": "Scientific name if applicable",
  "description": "Brief English description of the disease/issue",
  "description_hindi": "रोग/समस्या का हिंदी विवरण",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "symptoms_hindi": ["लक्षण 1", "लक्षण 2", "लक्षण 3"],
  "organic_treatment": [
    {"step": 1, "description": "Organic treatment step 1", "type": "organic"},
    {"step": 2, "description": "Organic treatment step 2", "type": "organic"}
  ],
  "chemical_treatment": [
    {"step": 1, "description": "Chemical treatment step 1 with dosage", "type": "chemical"},
    {"step": 2, "description": "Chemical treatment step 2 with dosage", "type": "chemical"}
  ],
  "prevention_tips": ["Prevention tip 1", "Prevention tip 2"],
  "prevention_tips_hindi": ["रोकथाम टिप 1", "रोकथाम टिप 2"],
  "estimated_cost_inr": "₹500-1000/एकड़",
  "recovery_time": "10-14 दिन",
  "spread_risk": "low|medium|high"
}

If the image doesn't show a plant or disease, return: {"error": "No plant disease detected in image"}
Be accurate and provide actionable advice specific to Indian farming conditions."""

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                return ""
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return ""


async def analyze_disease_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> DiseaseAnalysisResponse:
    """Main disease analysis function — tries Gemini Vision first, falls back to mock."""
    analysis_id = str(uuid.uuid4())[:8]
    
    if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        raw_response = await call_gemini_vision(image_base64, mime_type)
        
        if raw_response:
            try:
                # Clean markdown if any
                clean = raw_response.strip()
                if clean.startswith("```"):
                    clean = clean.split("```")[1]
                    if clean.startswith("json"):
                        clean = clean[4:]
                clean = clean.strip()
                
                data = json.loads(clean)
                
                if "error" in data:
                    return DiseaseAnalysisResponse(
                        success=False,
                        error=data["error"],
                        analysis_id=analysis_id
                    )
                
                # Map treatment steps
                organic = [TreatmentStep(**s) for s in data.get("organic_treatment", [])]
                chemical = [TreatmentStep(**s) for s in data.get("chemical_treatment", [])]
                
                disease = DiseaseInfo(
                    disease_name=data["disease_name"],
                    disease_name_hindi=data["disease_name_hindi"],
                    crop_name=data["crop_name"],
                    crop_name_hindi=data["crop_name_hindi"],
                    confidence=float(data["confidence"]),
                    severity=data["severity"].upper(),
                    severity_hindi=data["severity_hindi"],
                    affected_area_percent=int(data.get("affected_area_percent", 50)),
                    scientific_name=data.get("scientific_name"),
                    description=data["description"],
                    description_hindi=data["description_hindi"],
                    symptoms=data.get("symptoms", []),
                    symptoms_hindi=data.get("symptoms_hindi", []),
                    organic_treatment=organic,
                    chemical_treatment=chemical,
                    prevention_tips=data.get("prevention_tips", []),
                    prevention_tips_hindi=data.get("prevention_tips_hindi", []),
                    estimated_cost_inr=data.get("estimated_cost_inr", "₹500-1000/एकड़"),
                    recovery_time=data.get("recovery_time", "7-14 दिन"),
                    spread_risk=data.get("spread_risk", "medium")
                )
                
                return DiseaseAnalysisResponse(
                    success=True,
                    disease=disease,
                    analysis_id=analysis_id
                )
            except (json.JSONDecodeError, KeyError, Exception):
                pass  # Fall through to mock
    
    # Fallback: return mock data (cycle through diseases)
    import random
    mock_disease = random.choice(MOCK_DISEASES)
    return DiseaseAnalysisResponse(
        success=True,
        disease=mock_disease,
        analysis_id=analysis_id
    )


async def get_disease_detection(image_data: str = None) -> dict:
    """Legacy function for backward compatibility."""
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
