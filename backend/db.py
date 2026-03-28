import os
from supabase._async.client import AsyncClient, create_client

_SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
_SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

_client: AsyncClient | None = None


async def _get_client() -> AsyncClient:
    global _client
    if _client is None:
        _client = await create_client(_SUPABASE_URL, _SUPABASE_KEY)
    return _client


async def get_db() -> AsyncClient:
    """FastAPI dependency that returns a Supabase AsyncClient."""
    return await _get_client()
