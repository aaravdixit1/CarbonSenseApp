"""
FastAPI application for CarbonSenseAI.

Exposes a single POST /analyze endpoint that accepts a HabitProfile,
computes the carbon footprint, generates recommendations, and returns
an AnalyzeResponse.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from backend.models import AnalyzeResponse, HabitProfile
from backend.emissions_db import emissions_db
from backend.footprint_engine import compute_footprint
from backend.ai_pipeline import generate_recommendations

logger = logging.getLogger(__name__)

app = FastAPI(title="CarbonSenseAI")

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


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(profile: HabitProfile) -> AnalyzeResponse:
    """Accept a HabitProfile, compute footprint and recommendations."""
    correlation_id = str(uuid.uuid4())
    try:
        db_version = emissions_db.get_active_version()
        footprint = compute_footprint(profile, db_version)
        actions, fallback_used = await generate_recommendations(profile, footprint, db_version)
        return AnalyzeResponse(
            footprint=footprint,
            actions=actions,
            session_id=str(uuid.uuid4()),
            fallback_used=fallback_used,
        )
    except Exception as exc:
        logger.error("Internal error [%s]: %s", correlation_id, exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "message": f"An unexpected error occurred. Reference: {correlation_id}",
                "correlation_id": correlation_id,
            },
        )
