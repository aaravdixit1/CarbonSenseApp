"""
JWT authentication dependency for CarbonSense backend.

Verifies Supabase-issued JWTs and extracts the authenticated user's UUID.
"""

from __future__ import annotations

import os

from fastapi import Header, HTTPException
from jose import ExpiredSignatureError, JWTError, jwt

# Read the JWT secret at import time — fail fast if absent.
_JWT_SECRET: str = os.environ.get("SUPABASE_JWT_SECRET", "")
if not _JWT_SECRET:
    raise RuntimeError(
        "SUPABASE_JWT_SECRET environment variable is not set. "
        "The server cannot start without it."
    )

_ALGORITHM = "HS256"


async def get_current_user(authorization: str = Header(default=None)) -> str:
    """FastAPI dependency that verifies a Supabase JWT and returns the user UUID.

    Raises:
        HTTPException(401, {"error": "missing_token"}): when the Authorization
            header is absent.
        HTTPException(401, {"error": "invalid_token"}): when the token is
            expired, malformed, or signed with the wrong secret.
    """
    if authorization is None:
        raise HTTPException(status_code=401, detail={"error": "missing_token"})

    # Expect "Bearer <token>"
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail={"error": "invalid_token"})

    token = parts[1]

    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"error": "invalid_token"})
    except JWTError:
        raise HTTPException(status_code=401, detail={"error": "invalid_token"})

    sub: str | None = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail={"error": "invalid_token"})

    return sub
