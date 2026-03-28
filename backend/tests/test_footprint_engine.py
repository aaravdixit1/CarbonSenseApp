"""
Unit and property-based tests for footprint_engine.py.

Uses Hypothesis for property tests and pytest for example-based tests.
"""

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from backend.footprint_engine import compute_footprint
from backend.models import HabitProfile
from backend.emissions_db import emissions_db

# ---------------------------------------------------------------------------
# Hypothesis strategies
# ---------------------------------------------------------------------------

transport_methods = st.sampled_from(["car", "transit", "cycling", "walking"])
car_types = st.sampled_from(["gasoline", "diesel", "hybrid", "electric"])
diet_types = st.sampled_from(["omnivore", "flexitarian", "vegetarian", "vegan"])
meat_frequencies = st.sampled_from(["daily", "few_per_week", "weekly", "rarely"])
home_energy_sources = st.sampled_from(["grid", "natural_gas", "renewables", "mixed"])
shopping_frequencies = st.sampled_from(["rarely", "monthly", "weekly", "daily"])
flight_frequencies = st.sampled_from(["none", "one_or_two", "several", "frequent"])
household_sizes = st.integers(min_value=1, max_value=10)


@st.composite
def valid_habit_profile(draw):
    """Generate a valid HabitProfile, providing car_type only when transport_method='car'."""
    transport_method = draw(transport_methods)
    car_type = draw(car_types) if transport_method == "car" else None
    return HabitProfile(
        transport_method=transport_method,
        car_type=car_type,
        diet_type=draw(diet_types),
        meat_frequency=draw(meat_frequencies),
        home_energy_source=draw(home_energy_sources),
        household_size=draw(household_sizes),
        shopping_frequency=draw(shopping_frequencies),
        flight_frequency=draw(flight_frequencies),
    )


DB_VERSION = emissions_db.get_active_version()

# ---------------------------------------------------------------------------
# Property tests
# ---------------------------------------------------------------------------


# Feature: carbonsense-backend, Property 18: FootprintEngine breakdown completeness
@given(profile=valid_habit_profile())
@settings(max_examples=100)
def test_breakdown_has_four_categories(profile):
    """For any valid HabitProfile, compute_footprint returns exactly 4 breakdown categories.

    **Validates: Requirements 10.1**
    """
    result = compute_footprint(profile, DB_VERSION)
    categories = [b.category for b in result.breakdown]
    assert len(categories) == 4
    assert set(categories) == {"food", "transport", "home_energy", "shopping"}


# Feature: carbonsense-backend, Property 19: FootprintEngine sum invariant
@given(profile=valid_habit_profile())
@settings(max_examples=100)
def test_breakdown_sum_equals_total(profile):
    """Sum of absolute_tco2e across breakdown categories equals total_tco2e within 0.001.

    **Validates: Requirements 10.2**
    """
    result = compute_footprint(profile, DB_VERSION)
    breakdown_sum = sum(b.absolute_tco2e for b in result.breakdown)
    assert abs(breakdown_sum - result.total_tco2e) <= 0.001


# Feature: carbonsense-backend, Property 20: FootprintEngine non-negativity invariant
@given(profile=valid_habit_profile())
@settings(max_examples=100)
def test_total_non_negative(profile):
    """total_tco2e >= 0 for any valid HabitProfile.

    **Validates: Requirements 10.6**
    """
    result = compute_footprint(profile, DB_VERSION)
    assert result.total_tco2e >= 0


# Feature: carbonsense-backend, Property 21: FootprintEngine home energy per-person scaling
@given(profile=valid_habit_profile())
@settings(max_examples=100)
def test_home_energy_divided_by_household_size(profile):
    """home_energy absolute_tco2e == factors[home_key] / household_size within 0.001.

    Only verified when the home_energy_source maps to a known factor key (no substitution).

    **Validates: Requirements 10.5**
    """
    factors = emissions_db.get_factors(DB_VERSION)
    home_key = f"home_energy.annual.{profile.home_energy_source}"

    # Only assert the scaling property when the key exists (no fallback substitution)
    if home_key not in factors:
        return

    result = compute_footprint(profile, DB_VERSION)
    home_breakdown = next(b for b in result.breakdown if b.category == "home_energy")

    expected = factors[home_key] / profile.household_size
    assert abs(home_breakdown.absolute_tco2e - expected) <= 0.001


# ---------------------------------------------------------------------------
# Example tests
# ---------------------------------------------------------------------------


def test_food_fallback_used_for_unknown_combination():
    """When diet_type/meat_frequency combo doesn't exist in factors, food substituted=True.

    We force a fallback by patching the emissions DB with a version that lacks
    the specific food.annual key for the given combination.

    **Validates: Requirements 10.3**
    """
    # Load a stripped version of factors that omits all food.annual keys
    stripped_factors = {
        k: v
        for k, v in emissions_db.get_factors(DB_VERSION).items()
        if not k.startswith("food.annual.")
    }
    test_version = "test_food_fallback"
    emissions_db.load_version(test_version, stripped_factors)

    profile = HabitProfile(
        transport_method="cycling",
        car_type=None,
        diet_type="omnivore",
        meat_frequency="daily",
        home_energy_source="grid",
        household_size=2,
        shopping_frequency="monthly",
        flight_frequency="none",
    )

    result = compute_footprint(profile, test_version)
    food_breakdown = next(b for b in result.breakdown if b.category == "food")
    assert food_breakdown.substituted is True


def test_transport_fallback_used_for_unknown_method():
    """When transport_method='car' and car_type=None, transport breakdown substituted=True.

    car_type=None means the car key lookup (transport.annual.car.None) won't exist,
    triggering the global_average fallback.

    **Validates: Requirements 10.4**
    """
    # Build a profile with transport_method='car' but car_type=None by bypassing
    # Pydantic validation (model_construct skips validators)
    profile = HabitProfile.model_construct(
        transport_method="car",
        car_type=None,
        diet_type="omnivore",
        meat_frequency="daily",
        home_energy_source="grid",
        household_size=1,
        shopping_frequency="monthly",
        flight_frequency="none",
    )

    result = compute_footprint(profile, DB_VERSION)
    transport_breakdown = next(b for b in result.breakdown if b.category == "transport")
    assert transport_breakdown.substituted is True
