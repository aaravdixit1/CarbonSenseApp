"""
FastAPI application for CarbonSenseAI.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from backend.controllers.profile import router as profile_router
from backend.controllers.analyze import router as analyze_router
from backend.controllers.results import router as results_router
from backend.controllers.goals import router as goals_router
from backend.controllers.daily_logs import router as daily_logs_router

logger = logging.getLogger(__name__)

app = FastAPI(title="CarbonSenseAI")

app.include_router(profile_router)
app.include_router(analyze_router)
app.include_router(results_router)
app.include_router(goals_router)
app.include_router(daily_logs_router)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Override FastAPI's default 422 validation error handler → return HTTP 400
# ---------------------------------------------------------------------------

@app.exception_handler(ValidationError)
async def pydantic_validation_handler(request: Request, exc: ValidationError) -> JSONResponse:
    correlation_id = str(uuid.uuid4())
    # Build a human-readable message from the first error
    errors = exc.errors()
    if errors:
        first = errors[0]
        field = ".".join(str(loc) for loc in first.get("loc", []))
        reason = first.get("msg", "invalid value")
        message = f"{field}: {reason}"
    else:
        message = "Invalid request payload"
    logger.warning("Validation error [%s]: %s", correlation_id, message)
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": message,
            "correlation_id": correlation_id,
        },
    )


# FastAPI raises RequestValidationError (not ValidationError) for body parsing
from fastapi.exceptions import RequestValidationError


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    correlation_id = str(uuid.uuid4())
    errors = exc.errors()
    if errors:
        first = errors[0]
        field = ".".join(str(loc) for loc in first.get("loc", []) if loc != "body")
        reason = first.get("msg", "invalid value")
        message = f"{field}: {reason}" if field else reason
    else:
        message = "Invalid request payload"
    logger.warning("Request validation error [%s]: %s", correlation_id, message)
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": message,
            "correlation_id": correlation_id,
        },
    )



