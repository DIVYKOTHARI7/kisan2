import re
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1.api import api_router
from app.database import engine, Base

# Import all models to register them with Base
from app.models.user import User, SubscriptionPlan
from app.models.crop import CropRecommendation, CropCalendarTask
from app.models.disease import DiseaseDetection
from app.models.expert import ExpertProfile, Consultation
from app.models.community import CommunityPost, CommunityComment, CommunityLike, CommunityReport
from app.models.market import MarketplaceProduct, Payment
from app.models.system import GovernmentScheme, AuditLog

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"], # TODO: Update this in production to whitelist frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_STR)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str


def _is_hindi_text(text: str) -> bool:
    return bool(re.search(r"[\u0900-\u097F]", text))


def _system_prompt(user_message: str) -> str:
    if _is_hindi_text(user_message):
        return (
            "You are Krishi AI, an expert agriculture assistant for Indian farmers. "
            "Reply in Hindi with practical, step-by-step advice. Keep it concise and useful."
        )
    return (
        "You are Krishi AI, an expert agriculture assistant for Indian farmers. "
        "Reply in English with practical, step-by-step advice. Keep it concise and useful."
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    api_key = settings.OPENAI_API_KEY.strip()
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Set it in backend .env before calling /chat.",
        )

    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    request_body = {
        "model": settings.OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": _system_prompt(user_message)},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.4,
    }

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=request_body,
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Network error while contacting OpenAI: {str(exc)}",
        ) from exc

    if response.status_code >= 400:
        detail = response.text[:500] if response.text else "Unknown OpenAI error."
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {detail}")

    data = response.json()
    reply = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not reply:
        raise HTTPException(status_code=502, detail="OpenAI returned an empty reply.")

    return ChatResponse(reply=reply)


@app.get("/")
def root():
    return {"message": "Welcome to KrishiSathi API v3.0"}
