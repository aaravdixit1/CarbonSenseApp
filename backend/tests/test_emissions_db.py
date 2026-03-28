"""
Unit and property-based tests for EmissionsDatabase.

Tests cover:
- Example tests: initial state and known v1.0 factors
- Property tests (Hypothesis): load/promote round-trip, unknown version errors,
  and immutability of returned factor dicts.
"""

import sys
import os

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from backend.emissions_db import EmissionsDatabase

# Strategy for version strings: printable text, 1–20 chars
version_strategy = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "P", "S")),
    min_size=1,
    max_size=20,
)

# Strategy for factors dicts: text keys, float values
factors_strategy = st.dictionaries(
    keys=st.text(min_size=1, max_size=30),
    values=st.floats(allow_nan=False, allow_infinity=False),
)


# ---------------------------------------------------------------------------
# Example tests
# ---------------------------------------------------------------------------


def test_initial_active_version():
    """get_active_version() returns '1.0' after construction. Req 11.1"""
    db = EmissionsDatabase()
    assert db.get_active_version() == "1.0"


def test_v1_contains_food_global_average():
    """get_factors('1.0') returns a dict containing key 'food.global_average'. Req 11.2"""
    db = EmissionsDatabase()
    factors = db.get_factors("1.0")
    assert "food.global_average" in factors


# ---------------------------------------------------------------------------
# Property tests
# ---------------------------------------------------------------------------


@given(version=version_strategy, factors=factors_strategy)
@settings(max_examples=100)
def test_load_promote_round_trip(version, factors):
    # Feature: carbonsense-backend, Property 22: For any version string and
    # factors dict, load_version + promote_version makes get_active_version()
    # return that version and get_factors() return equal factors.
    # Validates: Requirements 11.3
    db = EmissionsDatabase()
    db.load_version(version, factors)
    db.promote_version(version)
    assert db.get_active_version() == version
    assert db.get_factors(version) == factors


@given(version=version_strategy)
@settings(max_examples=100)
def test_unknown_version_raises_key_error(version):
    # Feature: carbonsense-backend, Property 23: For any version string not
    # loaded, get_factors(v) and promote_version(v) raise KeyError.
    # Validates: Requirements 11.4, 11.5
    db = EmissionsDatabase()
    # Ensure the version is not one of the pre-loaded ones
    if version in ("1.0",):
        return

    with pytest.raises(KeyError):
        db.get_factors(version)

    with pytest.raises(KeyError):
        db.promote_version(version)


@given(version=version_strategy, factors=factors_strategy)
@settings(max_examples=100)
def test_get_factors_returns_copy(version, factors):
    # Feature: carbonsense-backend, Property 24: Mutating the dict returned by
    # get_factors(v) does not affect a subsequent get_factors(v) call.
    # Validates: Requirements 11.6
    db = EmissionsDatabase()
    db.load_version(version, factors)

    first = db.get_factors(version)
    # Mutate the returned dict
    first["__mutation_key__"] = 9999.0
    for key in list(first.keys()):
        first[key] = -1.0

    second = db.get_factors(version)
    assert second == factors
