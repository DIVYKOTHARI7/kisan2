from typing import Optional

from fastapi import Header, HTTPException

from app.core.security import decode_token


def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "", 1).strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")

    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    try:
        return int(subject)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token subject")
