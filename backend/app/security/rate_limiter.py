import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    """
    Sliding window rate limiter for public endpoints.
    Protects telemetry ingestion and auth routes from flood or abuse.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.rate = requests_per_minute
        self.history = defaultdict(list)

    def check(self, request: Request, identifier: str = None):
        now = time.time()
        client_ip = identifier or (request.client.host if request.client else "127.0.0.1")
        window_start = now - 60.0

        # Clean timestamps older than 60s
        self.history[client_ip] = [t for t in self.history[client_ip] if t > window_start]

        if len(self.history[client_ip]) >= self.rate:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please throttle your requests."
            )

        self.history[client_ip].append(now)

auth_limiter = InMemoryRateLimiter(requests_per_minute=30)
telemetry_limiter = InMemoryRateLimiter(requests_per_minute=120)
