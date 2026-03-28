"""
In-process sliding-window rate limiter for the CarbonSense backend.

Tracks per-user request counts using a deque of timestamps.
Window: 60 seconds, max 10 requests per user UUID.
"""

from __future__ import annotations

import time
from collections import deque
from typing import Dict

from fastapi import HTTPException


_WINDOW_SECONDS = 60
_MAX_REQUESTS = 10


class RateLimiter:
    """Sliding-window rate limiter keyed on user UUID.

    Stores ``{user_id: deque[timestamp]}`` in memory.  Suitable for
    single-instance deployments (no external store required).
    """

    def __init__(
        self,
        max_requests: int = _MAX_REQUESTS,
        window_seconds: int = _WINDOW_SECONDS,
    ) -> None:
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._store: Dict[str, deque] = {}

    def check(self, user_id: str) -> None:
        """Record a request for *user_id* and enforce the rate limit.

        Raises:
            HTTPException(429): when the user has exceeded the allowed
                number of requests within the sliding window.  The
                response body contains ``{"error": "rate_limit_exceeded",
                "retry_after_seconds": <int>}``.
        """
        now = time.monotonic()
        cutoff = now - self._window_seconds

        if user_id not in self._store:
            self._store[user_id] = deque()

        window = self._store[user_id]

        # Evict timestamps that have fallen outside the window.
        while window and window[0] <= cutoff:
            window.popleft()

        if len(window) >= self._max_requests:
            # Oldest timestamp still inside the window determines when the
            # user can next make a request.
            retry_after = int(window[0] - cutoff) + 1
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_exceeded",
                    "retry_after_seconds": retry_after,
                },
            )

        window.append(now)


# Singleton instance — import and use directly or wire as a FastAPI dependency.
rate_limiter = RateLimiter()
