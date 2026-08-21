import time
from functools import wraps
from flask import request, jsonify

# In-memory store: { ip_address: [timestamp1, timestamp2, ...] }
_rate_limit_store = {}


def rate_limit(limit=5, period=60):
    """
    Simple in-memory sliding-window rate limiter decorator.
    Allows up to `limit` requests per `period` seconds.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.remote_addr
            now = time.time()

            if ip not in _rate_limit_store:
                _rate_limit_store[ip] = []

            # Filter out timestamps older than the window period
            timestamps = [t for t in _rate_limit_store[ip] if now - t < period]

            if len(timestamps) >= limit:
                return jsonify({
                    "error": f"Too many requests. Limit is {limit} requests per {period} seconds.",
                    "status": "error"
                }), 429

            timestamps.append(now)
            _rate_limit_store[ip] = timestamps

            return f(*args, **kwargs)
        return wrapped
    return decorator
