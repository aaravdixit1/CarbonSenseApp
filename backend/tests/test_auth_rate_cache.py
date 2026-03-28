"""
Checkpoint tests for auth.py, rate_limiter.py, and cache.py.

Prerequisites:
    pip install -r CarbonSenseApp/requirements.txt
    (python-jose[cryptography], fastapi, pydantic, pytest)

Run from the CarbonSenseApp directory:
    pytest backend/tests/test_auth_rate_cache.py -v
"""

from __future__ import annotations

import importlib
import os
import sys
import time
import unittest.mock as mock
from unittest.mock import patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TEST_SECRET = "test-secret-key-for-unit-tests"
_TEST_UUID = "00000000-0000-0000-0000-000000000001"


def _make_token(sub: str = _TEST_UUID, secret: str = _TEST_SECRET, expired: bool = False) -> str:
    """Sign a minimal JWT using python-jose."""
    from jose import jwt as jose_jwt
    import datetime

    now = datetime.datetime.utcnow()
    if expired:
        exp = now - datetime.timedelta(hours=1)
    else:
        exp = now + datetime.timedelta(hours=1)

    payload = {"sub": sub, "exp": exp}
    return jose_jwt.encode(payload, secret, algorithm="HS256")


def _load_auth_module(secret: str = _TEST_SECRET):
    """Import (or reload) backend.auth with SUPABASE_JWT_SECRET set."""
    with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": secret}):
        if "backend.auth" in sys.modules:
            mod = importlib.reload(sys.modules["backend.auth"])
        else:
            import backend.auth as mod
        # Patch the module-level secret so it stays set after the context exits
        mod._JWT_SECRET = secret
    return mod


# ---------------------------------------------------------------------------
# auth.py tests
# ---------------------------------------------------------------------------

class TestAuth:
    """Tests for get_current_user dependency."""

    @pytest.fixture(autouse=True)
    def auth_module(self):
        """Ensure auth module is loaded with a known secret."""
        self.auth = _load_auth_module(_TEST_SECRET)

    @pytest.mark.asyncio
    async def test_missing_authorization_header_raises_401(self):
        """No Authorization header → HTTPException 401 missing_token."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await self.auth.get_current_user(authorization=None)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == {"error": "missing_token"}

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self):
        """Garbage token → HTTPException 401 invalid_token."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await self.auth.get_current_user(authorization="Bearer not.a.valid.token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == {"error": "invalid_token"}

    @pytest.mark.asyncio
    async def test_expired_token_raises_401(self):
        """Expired JWT → HTTPException 401 invalid_token."""
        from fastapi import HTTPException
        token = _make_token(expired=True)
        with pytest.raises(HTTPException) as exc_info:
            await self.auth.get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == {"error": "invalid_token"}

    @pytest.mark.asyncio
    async def test_wrong_secret_raises_401(self):
        """Token signed with wrong secret → HTTPException 401 invalid_token."""
        from fastapi import HTTPException
        token = _make_token(secret="wrong-secret")
        with pytest.raises(HTTPException) as exc_info:
            await self.auth.get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == {"error": "invalid_token"}

    @pytest.mark.asyncio
    async def test_valid_token_returns_user_uuid(self):
        """Valid JWT → returns the sub claim as a string UUID."""
        token = _make_token(sub=_TEST_UUID)
        result = await self.auth.get_current_user(authorization=f"Bearer {token}")
        assert result == _TEST_UUID

    @pytest.mark.asyncio
    async def test_missing_bearer_prefix_raises_401(self):
        """Authorization header without 'Bearer' prefix → 401 invalid_token."""
        from fastapi import HTTPException
        token = _make_token()
        with pytest.raises(HTTPException) as exc_info:
            await self.auth.get_current_user(authorization=token)  # no "Bearer "
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == {"error": "invalid_token"}


# ---------------------------------------------------------------------------
# rate_limiter.py tests
# ---------------------------------------------------------------------------

class TestRateLimiter:
    """Tests for RateLimiter.check()."""

    @pytest.fixture(autouse=True)
    def fresh_limiter(self):
        from backend.rate_limiter import RateLimiter
        self.limiter = RateLimiter(max_requests=10, window_seconds=60)

    def test_ten_requests_are_allowed(self):
        """First 10 requests for a user must not raise."""
        for _ in range(10):
            self.limiter.check("user-a")  # should not raise

    def test_eleventh_request_raises_429(self):
        """11th request within the window → HTTPException 429 with retry_after_seconds."""
        from fastapi import HTTPException
        for _ in range(10):
            self.limiter.check("user-b")
        with pytest.raises(HTTPException) as exc_info:
            self.limiter.check("user-b")
        assert exc_info.value.status_code == 429
        detail = exc_info.value.detail
        assert detail["error"] == "rate_limit_exceeded"
        assert "retry_after_seconds" in detail
        assert isinstance(detail["retry_after_seconds"], int)
        assert detail["retry_after_seconds"] > 0

    def test_two_users_are_isolated(self):
        """Exhausting user-c's limit must not affect user-d."""
        for _ in range(10):
            self.limiter.check("user-c")
        # user-c is now exhausted
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            self.limiter.check("user-c")
        # user-d should still have a full window
        for _ in range(10):
            self.limiter.check("user-d")  # must not raise

    def test_requests_outside_window_are_not_counted(self):
        """Timestamps older than the window are evicted and don't count."""
        from fastapi import HTTPException

        limiter = __import__("backend.rate_limiter", fromlist=["RateLimiter"]).RateLimiter(
            max_requests=3, window_seconds=60
        )
        user = "user-e"

        # Manually inject 3 old timestamps (outside the 60-s window)
        from collections import deque
        old_time = time.monotonic() - 120  # 2 minutes ago
        limiter._store[user] = deque([old_time, old_time, old_time])

        # All 3 new requests should succeed (old ones evicted)
        for _ in range(3):
            limiter.check(user)


# ---------------------------------------------------------------------------
# cache.py tests
# ---------------------------------------------------------------------------

def _make_profile(**overrides) -> "HabitProfile":
    from backend.models import HabitProfile
    defaults = dict(
        transport_method="car",
        car_type="gasoline",
        diet_type="omnivore",
        meat_frequency="daily",
        home_energy_source="grid",
        household_size=2,
        shopping_frequency="weekly",
        flight_frequency="none",
    )
    defaults.update(overrides)
    return HabitProfile(**defaults)


def _make_response(session_id: str = "sess-1") -> "AnalyzeResponse":
    from backend.models import AnalyzeResponse, FootprintResult, CategoryBreakdown
    footprint = FootprintResult(
        total_tco2e=5.0,
        breakdown=[
            CategoryBreakdown(
                category="food",
                absolute_tco2e=2.0,
                percentage=40.0,
                substituted=False,
            )
        ],
        db_version="1.0",
        factors_used={},
    )
    return AnalyzeResponse(
        footprint=footprint,
        actions=[],
        session_id=session_id,
        fallback_used=False,
    )


class TestAnalyzeCache:
    """Tests for AnalyzeCache.get() and .set()."""

    @pytest.fixture(autouse=True)
    def fresh_cache(self):
        from backend.cache import AnalyzeCache
        self.cache = AnalyzeCache(max_size=256, ttl=3600)

    def test_cache_miss_returns_none(self):
        """get() on an empty cache returns None."""
        profile = _make_profile()
        assert self.cache.get(profile) is None

    def test_set_then_get_returns_stored_response(self):
        """set() followed by get() returns the same response."""
        profile = _make_profile()
        response = _make_response("sess-hit")
        self.cache.set(profile, response)
        result = self.cache.get(profile)
        assert result is not None
        assert result.session_id == "sess-hit"

    def test_ttl_expiry_returns_none(self):
        """Entry older than TTL is treated as a cache miss."""
        from backend.cache import AnalyzeCache

        cache = AnalyzeCache(max_size=256, ttl=10)
        profile = _make_profile()
        response = _make_response("sess-ttl")

        # Insert at t=0
        with patch("backend.cache.time") as mock_time:
            mock_time.monotonic.return_value = 0.0
            cache.set(profile, response)

        # Retrieve at t=11 (past TTL)
        with patch("backend.cache.time") as mock_time:
            mock_time.monotonic.return_value = 11.0
            result = cache.get(profile)

        assert result is None

    def test_lru_eviction_keeps_max_256_entries(self):
        """Inserting 257 distinct profiles keeps only 256 entries."""
        from backend.cache import AnalyzeCache

        cache = AnalyzeCache(max_size=256, ttl=3600)
        profiles = [_make_profile(household_size=i % 10 + 1, flight_frequency="none") for i in range(257)]

        # Make each profile unique by varying a string field via a workaround:
        # use different session_ids in responses but vary profiles by transport_method cycling
        transport_options = ["car", "transit", "cycling", "walking"]
        diet_options = ["omnivore", "flexitarian", "vegetarian", "vegan"]
        meat_options = ["daily", "few_per_week", "weekly", "rarely"]
        energy_options = ["grid", "natural_gas", "renewables", "mixed"]
        shopping_options = ["rarely", "monthly", "weekly", "daily"]
        flight_options = ["none", "one_or_two", "several", "frequent"]

        from backend.models import HabitProfile

        inserted = []
        for i in range(257):
            p = HabitProfile(
                transport_method=transport_options[i % 4],
                car_type="gasoline" if transport_options[i % 4] == "car" else None,
                diet_type=diet_options[i % 4],
                meat_frequency=meat_options[i % 4],
                home_energy_source=energy_options[i % 4],
                household_size=(i % 10) + 1,
                shopping_frequency=shopping_options[i % 4],
                flight_frequency=flight_options[i % 4],
            )
            r = _make_response(f"sess-{i}")
            cache.set(p, r)
            inserted.append(p)

        assert len(cache._store) <= 256

    def test_lru_eviction_with_unique_profiles(self):
        """Inserting 257 truly distinct profiles evicts the LRU entry."""
        from backend.cache import AnalyzeCache
        from backend.models import HabitProfile
        import hashlib

        cache = AnalyzeCache(max_size=4, ttl=3600)  # small cache for easy testing

        # Create 5 distinct profiles by varying household_size 1..5
        profiles = []
        for i in range(1, 6):
            p = HabitProfile(
                transport_method="car",
                car_type="gasoline",
                diet_type="omnivore",
                meat_frequency="daily",
                home_energy_source="grid",
                household_size=i,
                shopping_frequency="weekly",
                flight_frequency="none",
            )
            profiles.append(p)

        # Insert first 4
        for i, p in enumerate(profiles[:4]):
            cache.set(p, _make_response(f"sess-{i}"))

        assert len(cache._store) == 4

        # Insert 5th — should evict the LRU (profiles[0])
        cache.set(profiles[4], _make_response("sess-4"))
        assert len(cache._store) == 4

        # profiles[0] (household_size=1) should have been evicted
        assert cache.get(profiles[0]) is None
        # profiles[4] (household_size=5) should be present
        assert cache.get(profiles[4]) is not None
