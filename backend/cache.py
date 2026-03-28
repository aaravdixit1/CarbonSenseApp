"""LRU cache for AnalyzeResponse, keyed on SHA-256 hash of HabitProfile."""

import hashlib
import time
from collections import OrderedDict

from backend.models import AnalyzeResponse, HabitProfile

_MAX_SIZE = 256
_TTL_SECONDS = 3600


class AnalyzeCache:
    """In-process LRU cache with TTL for AnalyzeResponse objects.

    - Max 256 entries; LRU eviction via OrderedDict.
    - TTL: 3600 s per entry; expired entries treated as cache miss.
    - Key: SHA-256 of the deterministic JSON serialisation of HabitProfile.
    """

    def __init__(self, max_size: int = _MAX_SIZE, ttl: int = _TTL_SECONDS) -> None:
        self._max_size = max_size
        self._ttl = ttl
        # Maps cache_key -> (AnalyzeResponse, inserted_at)
        self._store: OrderedDict[str, tuple[AnalyzeResponse, float]] = OrderedDict()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _make_key(profile: HabitProfile) -> str:
        serialised = profile.model_dump_json()
        return hashlib.sha256(serialised.encode()).hexdigest()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(self, profile: HabitProfile) -> AnalyzeResponse | None:
        """Return cached response or None on miss / expiry."""
        key = self._make_key(profile)
        if key not in self._store:
            return None

        response, inserted_at = self._store[key]

        # TTL check
        if time.monotonic() - inserted_at > self._ttl:
            del self._store[key]
            return None

        # Move to end (most-recently used)
        self._store.move_to_end(key)
        return response

    def set(self, profile: HabitProfile, response: AnalyzeResponse) -> None:
        """Store response; evict LRU entry if at capacity."""
        key = self._make_key(profile)

        if key in self._store:
            self._store.move_to_end(key)
        else:
            if len(self._store) >= self._max_size:
                # Evict least-recently used (first item)
                self._store.popitem(last=False)

        self._store[key] = (response, time.monotonic())


# Module-level singleton
analyze_cache = AnalyzeCache()
