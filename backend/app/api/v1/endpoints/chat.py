import asyncio
import json
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.config import settings

router = APIRouter()


def _latest_user_message(messages: list[dict[str, Any]]) -> str:
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return str(msg.get("content", ""))
    return ""


async def generate_mock_chat_response(messages: list[dict[str, Any]]):
    user_message_lower = _latest_user_message(messages).lower()
    if "weather" in user_message_lower or "rain" in user_message_lower or "बारिश" in user_message_lower:
        response_text = "बारिश की संभावना हो तो आज स्प्रे टालें और जल-निकास साफ रखें। खेत में सुबह निरीक्षण करें और नमी देखकर सिंचाई निर्णय लें।"
    elif "wheat" in user_message_lower or "गेहूं" in user_message_lower:
        response_text = "गेहूं के लिए CRI चरण पर पहली सिंचाई बहुत महत्वपूर्ण है। खरपतवार नियंत्रण समय पर करें और नाइट्रोजन विभाजित मात्रा में दें।"
    elif "scheme" in user_message_lower or "pm kisan" in user_message_lower or "योजना" in user_message_lower:
        response_text = "PM-Kisan में पात्र किसानों को 6000 रुपये प्रति वर्ष मिलते हैं। eKYC, बैंक खाता और भूमि रिकॉर्ड अपडेट होना जरूरी है।"
    else:
        response_text = "नमस्ते! मैं कृषि AI हूँ। आप फसल चयन, रोग नियंत्रण, खाद योजना, सिंचाई, मौसम या सरकारी योजना पर सवाल पूछ सकते हैं।"

    for i, word in enumerate(response_text.split()):
        chunk = word + (" " if i < len(response_text.split()) - 1 else "")
        data = {"choices": [{"delta": {"content": chunk}}]}
        yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.03)
    yield "data: [DONE]\n\n"


def _provider_config() -> tuple[str, str, str]:
    provider = settings.LLM_PROVIDER.lower().strip()
    if provider == "groq":
        return provider, settings.GROQ_API_KEY, "https://api.groq.com/openai/v1/chat/completions"
    if provider == "openai":
        return provider, settings.OPENAI_API_KEY, "https://api.openai.com/v1/chat/completions"
    if provider == "gemini":
        return provider, settings.GEMINI_API_KEY, f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:streamGenerateContent?key={settings.GEMINI_API_KEY}"
    return "mock", "", ""


def _provider_model(provider: str) -> str:
    if provider == "groq":
        return settings.GROQ_MODEL
    if provider == "openai":
        return settings.OPENAI_MODEL
    return "mock-model"


def _normalize_messages(messages: list[dict[str, Any]]) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for msg in messages[-20:]:
        role = str(msg.get("role", "user"))
        content = str(msg.get("content", "")).strip()
        if role not in {"system", "user", "assistant"} or not content:
            continue
        normalized.append({"role": role, "content": content})
    return normalized


def _system_prompt(profile: dict[str, Any] | None) -> str:
    language = "Hindi"
    if profile and profile.get("preferred_language"):
        language = str(profile.get("preferred_language"))
    return (
        "You are Krishi AI, an expert agriculture assistant for Indian farmers. "
        "Respond with practical, step-by-step advice, concise and actionable. "
        "Default response language should be "
        f"{language}. If user asks in Hinglish/Hindi, answer in Hinglish/Hindi."
    )


async def _stream_real_provider(
    provider: str, api_key: str, endpoint: str, messages: list[dict[str, str]], profile: dict[str, Any] | None, image: dict[str, str] | None = None
):
    if provider == "gemini":
        # Gemini specific streaming logic
        contents = []
        system_instr = _system_prompt(profile)
        
        # Convert messages to Gemini format
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
            
        # Add image to the last message if provided
        if image and contents:
            contents[-1]["parts"].append({
                "inline_data": {
                    "mime_type": image.get("mimeType", "image/jpeg"),
                    "data": image.get("data", "")
                }
            })
            
        payload = {
            "contents": contents,
            "system_instruction": {"parts": [{"text": system_instr}]},
            "generationConfig": {"temperature": 0.4}
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            async with client.stream("POST", endpoint, json=payload) as resp:
                if resp.status_code >= 400:
                    body = await resp.aread()
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gemini API error: {body.decode('utf-8', errors='ignore')[:300]}",
                    )

                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        # Gemini returns JSON chunks, sometimes prefixed with data: if using a proxy, 
                        # but standard REST stream is just a series of JSON objects in a list-like format
                        clean_line = line.strip().lstrip(',[').rstrip(',]')
                        if not clean_line:
                            continue
                        chunk = json.loads(clean_line)
                        if "candidates" in chunk:
                            text = chunk["candidates"][0]["content"]["parts"][0].get("text", "")
                            if text:
                                data = {"choices": [{"delta": {"content": text}}]}
                                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
                    except:
                        continue
                yield "data: [DONE]\n\n"
        return

    payload = {
        "model": _provider_model(provider),
        "messages": [{"role": "system", "content": _system_prompt(profile)}, *messages],
        "temperature": 0.4,
        "stream": True,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        async with client.stream("POST", endpoint, headers=headers, json=payload) as resp:
            if resp.status_code >= 400:
                body = await resp.aread()
                raise HTTPException(
                    status_code=502,
                    detail=f"LLM provider error ({provider}): {body.decode('utf-8', errors='ignore')[:300]}",
                )

            async for line in resp.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    yield line + "\n\n"
            yield "data: [DONE]\n\n"


@router.post("/message")
async def chat_message(request: Request):
    try:
        body = await request.json()
        raw_messages = body.get("messages", []) or []
        profile = body.get("profile", None)
        image = body.get("image", None)
        messages = _normalize_messages(raw_messages)

        provider, api_key, endpoint = _provider_config()
        if provider == "mock" or not api_key:
            return StreamingResponse(generate_mock_chat_response(messages), media_type="text/event-stream")

        return StreamingResponse(
            _stream_real_provider(provider, api_key, endpoint, messages, profile, image),
            media_type="text/event-stream",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
