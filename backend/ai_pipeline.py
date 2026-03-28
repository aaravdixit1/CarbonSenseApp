"""
AI Pipeline for CarbonSenseAI.

Implements a two-prompt LLM pipeline (GPT-4o) with RAG against the
EmissionsDatabase to generate exactly 3 ranked, personalized Action items.

Falls back to static top-3 from EmissionsDatabase on timeout or any error.
"""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

from backend.models import Action, FootprintResult, HabitProfile
from backend.emissions_db import emissions_db

# Reference constants for footprint context
_GLOBAL_AVG_TCO2E = 4.7
_PARIS_TARGET_TCO2E = 2.3

# Composite score weights
_W_SAVINGS = 0.5
_W_FEASIBILITY = 0.3
_W_FRICTION = 0.2

# LLM timeout in seconds
_LLM_TIMEOUT = 10.0


# ---------------------------------------------------------------------------
# Low-impact exclusion rules
# ---------------------------------------------------------------------------

def _is_action_excluded(action_id: str, profile: HabitProfile) -> bool:
    """Return True if the action should be excluded based on the profile."""
    aid = action_id.lower()

    # Flight actions excluded when user has no flights
    if profile.flight_frequency == "none" and "flight" in aid:
        return True

    # Diet actions excluded for vegans
    if profile.diet_type == "vegan" and ("diet" in aid or "food" in aid or "meat" in aid or "beef" in aid or "plant" in aid):
        return True

    # Transport mode switch excluded for cyclists/walkers
    if profile.transport_method in ("cycling", "walking") and "transport" in aid:
        return True

    # Shopping actions excluded for rare shoppers
    if profile.shopping_frequency == "rarely" and "shopping" in aid:
        return True

    return False


def _build_context_prompt(profile: HabitProfile, footprint: FootprintResult) -> str:
    """Build Prompt 1: footprint context relative to global averages."""
    total = footprint.total_tco2e
    vs_global = total - _GLOBAL_AVG_TCO2E
    vs_paris = total - _PARIS_TARGET_TCO2E

    breakdown_lines = "\n".join(
        f"  - {b.category}: {b.absolute_tco2e:.2f} tCO2e ({b.percentage:.1f}%)"
        for b in footprint.breakdown
    )

    direction_global = "above" if vs_global >= 0 else "below"
    direction_paris = "above" if vs_paris >= 0 else "below"

    return (
        f"You are a climate data analyst. Summarize the following user's annual carbon footprint "
        f"relative to global benchmarks.\n\n"
        f"User footprint: {total:.2f} tCO2e/year\n"
        f"Global average: {_GLOBAL_AVG_TCO2E} tCO2e/year "
        f"({abs(vs_global):.2f} tCO2e {direction_global} average)\n"
        f"Paris Agreement target: {_PARIS_TARGET_TCO2E} tCO2e/year "
        f"({abs(vs_paris):.2f} tCO2e {direction_paris} target)\n\n"
        f"Breakdown by category:\n{breakdown_lines}\n\n"
        f"Provide a concise 2-3 sentence narrative summary of this footprint profile, "
        f"highlighting the highest-impact categories."
    )


def _build_recommendation_prompt(
    profile: HabitProfile,
    footprint: FootprintResult,
    context_summary: str,
    factors: dict[str, float],
) -> str:
    """Build Prompt 2: RAG-grounded recommendation generation."""
    # Select relevant emissions factors as RAG context
    rag_factors = {
        k: v for k, v in factors.items()
        if any(cat in k for cat in ("annual", "flights", "global_average"))
    }
    rag_lines = "\n".join(f"  {k}: {v}" for k, v in sorted(rag_factors.items()))

    profile_summary = (
        f"transport_method={profile.transport_method}, "
        f"car_type={profile.car_type}, "
        f"diet_type={profile.diet_type}, "
        f"meat_frequency={profile.meat_frequency}, "
        f"home_energy_source={profile.home_energy_source}, "
        f"household_size={profile.household_size}, "
        f"shopping_frequency={profile.shopping_frequency}, "
        f"flight_frequency={profile.flight_frequency}"
    )

    return (
        f"You are a personalized climate action advisor.\n\n"
        f"Footprint context:\n{context_summary}\n\n"
        f"User habit profile:\n{profile_summary}\n\n"
        f"Emissions factors (tCO2e/year) from authoritative database:\n{rag_lines}\n\n"
        f"Based on this user's specific habits and the emissions factors above, generate exactly 3 "
        f"ranked, personalized action recommendations. Each action must:\n"
        f"- Target a habit the user has NOT already optimized\n"
        f"- Include a realistic CO2 savings estimate grounded in the emissions factors provided\n"
        f"- Include a feasibility_score (0.0-1.0, higher = easier to adopt)\n"
        f"- Include a friction_score (0.0-1.0, higher = more behavioral change required)\n\n"
        f"Return ONLY a valid JSON array with exactly 3 objects, each with these fields:\n"
        f"  id (string), description (string), savings_tco2e (float), impact_label (string), "
        f"  rank (int 1-3), composite_score (float), feasibility_score (float), friction_score (float)\n\n"
        f"impact_label should be one of: 'your biggest lever', 'high impact', 'meaningful step'\n"
        f"Do not include any text outside the JSON array."
    )


def _compute_composite_score(
    savings_tco2e: float,
    feasibility_score: float,
    friction_score: float,
    max_savings: float,
) -> float:
    """Compute composite score = 0.5*(savings/max) + 0.3*feasibility + 0.2*(1-friction)."""
    if max_savings <= 0:
        normalized_savings = 0.0
    else:
        normalized_savings = min(savings_tco2e / max_savings, 1.0)
    return (
        _W_SAVINGS * normalized_savings
        + _W_FEASIBILITY * feasibility_score
        + _W_FRICTION * (1.0 - friction_score)
    )


def _parse_actions(raw: list[dict[str, Any]]) -> list[Action]:
    """Parse raw LLM dicts into Action objects, computing composite scores."""
    if not raw:
        return []

    max_savings = max((item.get("savings_tco2e", 0.0) for item in raw), default=1.0)
    if max_savings <= 0:
        max_savings = 1.0

    actions: list[Action] = []
    for item in raw:
        savings = float(item.get("savings_tco2e", 0.0))
        feasibility = float(item.get("feasibility_score", 0.5))
        friction = float(item.get("friction_score", 0.5))
        composite = _compute_composite_score(savings, feasibility, friction, max_savings)

        actions.append(
            Action(
                id=str(item.get("id", f"action_{len(actions)+1}")),
                description=str(item.get("description", "")),
                savings_tco2e=savings,
                impact_label=str(item.get("impact_label", "meaningful step")),
                rank=0,  # assigned after sorting
                composite_score=round(composite, 4),
            )
        )

    # Sort by composite score descending, assign ranks 1-3
    actions.sort(key=lambda a: a.composite_score, reverse=True)
    for i, action in enumerate(actions[:3]):
        action.rank = i + 1

    return actions[:3]


def _fallback_actions() -> list[Action]:
    """Convert EmissionsDatabase fallback dicts to Action objects."""
    raw = emissions_db.get_fallback_actions()
    return [
        Action(
            id=item["id"],
            description=item["description"],
            savings_tco2e=item["savings_tco2e"],
            impact_label=item["impact_label"],
            rank=item["rank"],
            composite_score=item["composite_score"],
        )
        for item in raw
    ]


async def _call_llm(
    profile: HabitProfile,
    footprint: FootprintResult,
    db_version: str,
) -> list[Action]:
    """Run the two-prompt LLM pipeline and return parsed Action objects."""
    import openai  # imported here so missing package doesn't break the module

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    client = openai.AsyncOpenAI(api_key=api_key)
    factors = emissions_db.get_factors(db_version)

    # ── Prompt 1: context ────────────────────────────────────────────────────
    context_prompt = _build_context_prompt(profile, footprint)
    context_response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": context_prompt}],
        temperature=0.3,
        max_tokens=300,
    )
    context_summary = context_response.choices[0].message.content or ""

    # ── Prompt 2: RAG-grounded recommendations ───────────────────────────────
    rec_prompt = _build_recommendation_prompt(profile, footprint, context_summary, factors)
    rec_response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": rec_prompt}],
        temperature=0.2,
        max_tokens=800,
        response_format={"type": "json_object"},
    )
    raw_content = rec_response.choices[0].message.content or "[]"

    # The model may return {"actions": [...]} or a bare array
    parsed = json.loads(raw_content)
    if isinstance(parsed, dict):
        # Try common wrapper keys
        raw_list = parsed.get("actions") or parsed.get("recommendations") or list(parsed.values())[0]
    else:
        raw_list = parsed

    if not isinstance(raw_list, list):
        raise ValueError(f"Unexpected LLM response shape: {type(raw_list)}")

    actions = _parse_actions(raw_list)

    # Apply exclusion rules
    actions = [a for a in actions if not _is_action_excluded(a.id, profile)]

    # Re-rank after exclusion
    for i, action in enumerate(actions):
        action.rank = i + 1

    return actions


async def generate_recommendations(
    profile: HabitProfile,
    footprint: FootprintResult,
    db_version: str,
) -> tuple[list[Action], bool]:
    """Generate exactly 3 ranked Action recommendations for the given profile.

    Uses a two-prompt LLM pipeline (GPT-4o) grounded in RAG against the
    EmissionsDatabase. Falls back to static top-3 from EmissionsDatabase if:
    - OPENAI_API_KEY is not set
    - The LLM call exceeds 10 seconds
    - Any exception occurs during the LLM call

    Args:
        profile: The user's habit profile.
        footprint: The computed footprint result.
        db_version: The emissions database version to use for RAG context.

    Returns:
        A tuple of (list[Action], fallback_used: bool).
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_actions(), True

    try:
        actions = await asyncio.wait_for(
            _call_llm(profile, footprint, db_version),
            timeout=_LLM_TIMEOUT,
        )
        # If LLM returned fewer than 3 actions after exclusion, pad with fallback
        if len(actions) < 3:
            fallback = _fallback_actions()
            existing_ids = {a.id for a in actions}
            for fb_action in fallback:
                if fb_action.id not in existing_ids and not _is_action_excluded(fb_action.id, profile):
                    actions.append(fb_action)
                if len(actions) >= 3:
                    break
            # Re-rank
            for i, action in enumerate(actions[:3]):
                action.rank = i + 1
            actions = actions[:3]
        return actions, False
    except Exception:
        return _fallback_actions(), True
