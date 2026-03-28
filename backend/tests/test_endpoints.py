"""
Integration tests for all CarbonSense API endpoints.

Tests use httpx.AsyncClient with ASGITransport against the real FastAPI app,
with Supabase DB calls mocked via dependency_overrides and unittest.mock.AsyncMock.

Run from the CarbonSenseApp directory:
    pytest backend/tests/test_endpoints.py -v
"""

from __future__ import annotations

import datetime
import os
import sys
import unittest.mock as mock
from unittest.mock import AsyncMock, MagicMock, patch

# ---------------------------------------------------------------------------
# Bootstrap: set env vars BEFORE any backend module is imported so that
# backend.auth doesn't raise RuntimeError at import time.
# ---------------------------------------------------------------------------
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-for-endpoints")
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")

import pytest
from httpx import ASGITransport, AsyncClient

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_TEST_SECRET = "test-secret-for-endpoints"
_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
_OTHER_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
_GOAL_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc"
_ACTION_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_token(sub: str = _USER_ID, secret: str = _TEST_SECRET, expired: bool = False) -> str:
    from jose import jwt as jose_jwt

    now = datetime.datetime.utcnow()
    exp = now - datetime.timedelta(hours=1) if expired else now + datetime.timedelta(hours=1)
    return jose_jwt.encode({"sub": sub, "exp": exp}, secret, algorithm="HS256")


def _auth_headers(sub: str = _USER_ID) -> dict:
    return {"Authorization": f"Bearer {_make_token(sub=sub)}"}


def _make_mock_db() -> MagicMock:
    """Return a MagicMock that mimics the Supabase AsyncClient fluent query API."""
    db = MagicMock()
    db.table.return_value = db
    db.select.return_value = db
    db.eq.return_value = db
    db.order.return_value = db
    db.insert.return_value = db
    db.upsert.return_value = db
    db.update.return_value = db
    db.delete.return_value = db
    db.execute = AsyncMock(return_value=MagicMock(data=[]))
    return db


# ---------------------------------------------------------------------------
# Module-level import of backend modules (env vars already set above)
# ---------------------------------------------------------------------------

import backend.auth as _auth_module  # noqa: E402 — must come after env setup
_auth_module._JWT_SECRET = _TEST_SECRET  # override the loaded secret

from backend.main import app as _app  # noqa: E402
from backend.db import get_db  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_jwt_secret():
    """Keep backend.auth._JWT_SECRET pointing at the test secret for every test."""
    original = _auth_module._JWT_SECRET
    _auth_module._JWT_SECRET = _TEST_SECRET
    yield
    _auth_module._JWT_SECRET = original


@pytest.fixture()
def mock_db():
    return _make_mock_db()


@pytest.fixture()
def app_with_db(mock_db):
    """Override get_db with the mock_db fixture and clean up after the test."""
    async def _override():
        return mock_db

    _app.dependency_overrides[get_db] = _override
    yield _app, mock_db
    _app.dependency_overrides.pop(get_db, None)


# ---------------------------------------------------------------------------
# Profile endpoints
# ---------------------------------------------------------------------------

VALID_PROFILE_BODY = {
    "transport_method": "car",
    "car_type": "gasoline",
    "diet_type": "omnivore",
    "meat_frequency": "daily",
    "home_energy_source": "grid",
    "household_size": 2,
    "shopping_frequency": "weekly",
    "flight_frequency": "none",
}

SAVED_PROFILE_ROW = {
    "user_id": _USER_ID,
    **VALID_PROFILE_BODY,
}


class TestProfileEndpoints:

    @pytest.mark.asyncio
    async def test_put_profile_valid_jwt_returns_200(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[SAVED_PROFILE_ROW]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put("/profile", json=VALID_PROFILE_BODY, headers=_auth_headers())

        assert resp.status_code == 200
        body = resp.json()
        assert body["user_id"] == _USER_ID
        assert body["transport_method"] == "car"

    @pytest.mark.asyncio
    async def test_get_profile_exists_returns_200(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[SAVED_PROFILE_ROW]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/profile", headers=_auth_headers())

        assert resp.status_code == 200
        assert resp.json()["user_id"] == _USER_ID

    @pytest.mark.asyncio
    async def test_get_profile_not_found_returns_404(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/profile", headers=_auth_headers())

        assert resp.status_code == 404
        assert resp.json()["detail"] == {"error": "profile_not_found"}

    @pytest.mark.asyncio
    async def test_put_profile_no_jwt_returns_401(self, app_with_db):
        app, db = app_with_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put("/profile", json=VALID_PROFILE_BODY)

        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Results endpoints
# ---------------------------------------------------------------------------

RESULTS_ROW = {
    "user_id": _USER_ID,
    "total_tco2e": 8.5,
    "db_version": "1.0",
    "fallback_used": False,
    "breakdown": [],
    "factors_used": {},
}


class TestResultsEndpoints:

    @pytest.mark.asyncio
    async def test_get_results_exists_returns_200(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[RESULTS_ROW]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/results", headers=_auth_headers())

        assert resp.status_code == 200
        assert resp.json()["total_tco2e"] == 8.5

    @pytest.mark.asyncio
    async def test_get_results_not_found_returns_404(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/results", headers=_auth_headers())

        assert resp.status_code == 404
        assert resp.json()["detail"] == {"error": "results_not_found"}

    @pytest.mark.asyncio
    async def test_get_results_no_jwt_returns_401(self, app_with_db):
        app, db = app_with_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/results")

        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Goals endpoints
# ---------------------------------------------------------------------------

GOAL_ROW = {
    "id": _GOAL_ID,
    "user_id": _USER_ID,
    "action_id": _ACTION_ID,
    "status": "active",
    "committed_at": "2024-01-01T00:00:00+00:00",
    "completed_at": None,
}

GOAL_ROW_OTHER_USER = {**GOAL_ROW, "user_id": _OTHER_USER_ID}


class TestGoalsEndpoints:

    @pytest.mark.asyncio
    async def test_post_goal_valid_returns_201(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[GOAL_ROW]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/goals",
                json={"action_id": _ACTION_ID},
                headers=_auth_headers(),
            )

        assert resp.status_code == 201
        assert resp.json()["action_id"] == _ACTION_ID

    @pytest.mark.asyncio
    async def test_patch_goal_valid_status_returns_200(self, app_with_db):
        app, db = app_with_db
        updated_row = {**GOAL_ROW, "status": "dismissed"}
        db.execute = AsyncMock(
            side_effect=[
                MagicMock(data=[GOAL_ROW]),   # fetch
                MagicMock(data=[updated_row]),  # update
            ]
        )

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch(
                f"/goals/{_GOAL_ID}",
                json={"status": "dismissed"},
                headers=_auth_headers(),
            )

        assert resp.status_code == 200
        assert resp.json()["status"] == "dismissed"

    @pytest.mark.asyncio
    async def test_patch_goal_completed_sets_completed_at(self, app_with_db):
        app, db = app_with_db
        completed_row = {**GOAL_ROW, "status": "completed", "completed_at": "2024-06-01T12:00:00+00:00"}
        db.execute = AsyncMock(
            side_effect=[
                MagicMock(data=[GOAL_ROW]),
                MagicMock(data=[completed_row]),
            ]
        )

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch(
                f"/goals/{_GOAL_ID}",
                json={"status": "completed"},
                headers=_auth_headers(),
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "completed"
        assert body["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_patch_goal_different_user_returns_403(self, app_with_db):
        app, db = app_with_db
        # Goal belongs to _OTHER_USER_ID; request comes from _USER_ID
        db.execute = AsyncMock(return_value=MagicMock(data=[GOAL_ROW_OTHER_USER]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch(
                f"/goals/{_GOAL_ID}",
                json={"status": "completed"},
                headers=_auth_headers(sub=_USER_ID),
            )

        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_patch_goal_invalid_status_returns_400(self, app_with_db):
        app, db = app_with_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch(
                f"/goals/{_GOAL_ID}",
                json={"status": "invalid_status"},
                headers=_auth_headers(),
            )

        # Pydantic rejects the Literal before the service is called → 400
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_get_goals_returns_200_with_list(self, app_with_db):
        app, db = app_with_db
        db.execute = AsyncMock(return_value=MagicMock(data=[GOAL_ROW]))

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/goals", headers=_auth_headers())

        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) == 1
        assert body[0]["id"] == _GOAL_ID

    @pytest.mark.asyncio
    async def test_post_goal_no_jwt_returns_401(self, app_with_db):
        app, db = app_with_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/goals", json={"action_id": _ACTION_ID})

        assert resp.status_code == 401
