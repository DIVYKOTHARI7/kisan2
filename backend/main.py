import os
import re

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()
load_dotenv("../.env")

app = FastAPI(title="Krishi Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str


def _is_hindi_text(text: str) -> bool:
    return bool(re.search(r"[\u0900-\u097F]", text))


def _build_system_prompt(user_message: str) -> str:
    return (
        "You are Krishi AI, an agriculture advisor for Indian farmers. "
        "Respond in the language the user used or preferred. "
        "If the user asks in Hindi (Devanagari or Romanized/Hinglish), respond in Hindi (Devanagari). "
        "Give practical and concise advice."
    )


def _extract_gemini_reply(data: dict) -> str:
    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    text_parts = [p.get("text", "") for p in parts if isinstance(p, dict) and p.get("text")]
    return "".join(text_parts).strip()


async def _call_openai(user_message: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Add it in .env and restart backend.",
        )

    body = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": _build_system_prompt(user_message)},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.4,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Network error while contacting OpenAI: {exc}") from exc

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {resp.text[:500]}")

    data = resp.json()
    reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not reply:
        raise HTTPException(status_code=502, detail="OpenAI returned an empty reply.")
    return reply


async def _call_gemini(user_message: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing. Add it in .env and restart backend.",
        )

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    prompt = _build_system_prompt(user_message)
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    body = {
        "contents": [
            {"role": "user", "parts": [{"text": f"{prompt}\n\nUser question: {user_message}"}]},
        ],
        "generationConfig": {"temperature": 0.4},
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(endpoint, json=body)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Network error while contacting Gemini: {exc}") from exc

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {resp.text[:500]}")

    data = resp.json()
    reply = _extract_gemini_reply(data)
    if not reply:
        raise HTTPException(status_code=502, detail="Gemini returned an empty reply.")
    return reply


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    if provider == "gemini":
        reply = await _call_gemini(user_message)
    elif provider == "openai":
        reply = await _call_openai(user_message)
    else:
        raise HTTPException(
            status_code=500,
            detail="Unsupported LLM_PROVIDER. Use 'openai' or 'gemini'.",
        )
    return ChatResponse(reply=reply)
