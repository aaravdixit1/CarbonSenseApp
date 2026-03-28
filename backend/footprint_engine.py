"""
Footprint Engine for CarbonSenseAI.

Computes annual carbon footprint estimates from a HabitProfile using
emissions factors from the EmissionsDatabase.
"""

from backend.models import CategoryBreakdown, FootprintResult, HabitProfile
from backend.emissions_db import emissions_db


def compute_footprint(profile: HabitProfile, db_version: str) -> FootprintResult:
    """Compute annual tCO2e footprint for a given HabitProfile.

    Args:
        profile: The user's habit profile.
        db_version: The emissions database version to use for factor lookup.

    Returns:
        FootprintResult with per-category breakdown, total, db_version, and
        factors_used for auditability.
    """
    factors = emissions_db.get_factors(db_version)
    factors_used: dict[str, float] = {}

    # ── Food ─────────────────────────────────────────────────────────────────
    food_key = f"food.annual.{profile.diet_type}.{profile.meat_frequency}"
    if food_key in factors:
        food_tco2e = factors[food_key]
        food_substituted = False
        factors_used[food_key] = food_tco2e
    else:
        fallback_key = "food.global_average"
        food_tco2e = factors[fallback_key]
        food_substituted = True
        factors_used[fallback_key] = food_tco2e

    # ── Transport ─────────────────────────────────────────────────────────────
    transport_substituted = False
    transport_tco2e = 0.0

    if profile.transport_method == "car":
        car_key = f"transport.annual.car.{profile.car_type}"
        if car_key in factors:
            transport_tco2e = factors[car_key]
            factors_used[car_key] = transport_tco2e
        else:
            fallback_key = "transport.global_average"
            transport_tco2e = factors[fallback_key]
            transport_substituted = True
            factors_used[fallback_key] = transport_tco2e
    else:
        method_key = f"transport.annual.{profile.transport_method}"
        if method_key in factors:
            transport_tco2e = factors[method_key]
            factors_used[method_key] = transport_tco2e
        else:
            fallback_key = "transport.global_average"
            transport_tco2e = factors[fallback_key]
            transport_substituted = True
            factors_used[fallback_key] = transport_tco2e

    # Add flight contribution (only if transport wasn't already substituted)
    if not transport_substituted:
        flight_key = f"transport.flights.{profile.flight_frequency}"
        if flight_key in factors:
            transport_tco2e += factors[flight_key]
            factors_used[flight_key] = factors[flight_key]
        else:
            # Flight key missing — substitute entire transport with global average
            fallback_key = "transport.global_average"
            transport_tco2e = factors[fallback_key]
            transport_substituted = True
            factors_used.pop(
                f"transport.annual.car.{profile.car_type}",
                factors_used.pop(
                    f"transport.annual.{profile.transport_method}", None
                ),
            )
            factors_used[fallback_key] = transport_tco2e

    # ── Home Energy ───────────────────────────────────────────────────────────
    home_key = f"home_energy.annual.{profile.home_energy_source}"
    if home_key in factors:
        home_tco2e = factors[home_key] / profile.household_size
        home_substituted = False
        factors_used[home_key] = factors[home_key]
    else:
        fallback_key = "home_energy.global_average"
        home_tco2e = factors[fallback_key]
        home_substituted = True
        factors_used[fallback_key] = factors[fallback_key]

    # ── Shopping ──────────────────────────────────────────────────────────────
    shopping_key = f"shopping.annual.{profile.shopping_frequency}"
    if shopping_key in factors:
        shopping_tco2e = factors[shopping_key]
        shopping_substituted = False
        factors_used[shopping_key] = shopping_tco2e
    else:
        fallback_key = "shopping.global_average"
        shopping_tco2e = factors[fallback_key]
        shopping_substituted = True
        factors_used[fallback_key] = shopping_tco2e

    # ── Totals and percentages ────────────────────────────────────────────────
    total = food_tco2e + transport_tco2e + home_tco2e + shopping_tco2e

    def pct(value: float) -> float:
        return (value / total * 100) if total > 0 else 0.0

    breakdown = [
        CategoryBreakdown(
            category="food",
            absolute_tco2e=round(food_tco2e, 4),
            percentage=round(pct(food_tco2e), 4),
            substituted=food_substituted,
        ),
        CategoryBreakdown(
            category="transport",
            absolute_tco2e=round(transport_tco2e, 4),
            percentage=round(pct(transport_tco2e), 4),
            substituted=transport_substituted,
        ),
        CategoryBreakdown(
            category="home_energy",
            absolute_tco2e=round(home_tco2e, 4),
            percentage=round(pct(home_tco2e), 4),
            substituted=home_substituted,
        ),
        CategoryBreakdown(
            category="shopping",
            absolute_tco2e=round(shopping_tco2e, 4),
            percentage=round(pct(shopping_tco2e), 4),
            substituted=shopping_substituted,
        ),
    ]

    return FootprintResult(
        total_tco2e=round(total, 4),
        breakdown=breakdown,
        db_version=db_version,
        factors_used=factors_used,
    )
