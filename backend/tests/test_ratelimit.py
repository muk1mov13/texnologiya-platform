from app.core.ratelimit import InMemoryRateLimiter


def test_blocks_after_limit_and_unblocks_after_window() -> None:
    now = [0.0]
    limiter = InMemoryRateLimiter(limit=2, window_seconds=60, clock=lambda: now[0])
    limiter.record_failure("ip:ali")
    assert not limiter.is_blocked("ip:ali")
    limiter.record_failure("ip:ali")
    assert limiter.is_blocked("ip:ali")
    now[0] = 61.0
    assert not limiter.is_blocked("ip:ali")


def test_reset_clears_only_that_key() -> None:
    limiter = InMemoryRateLimiter(limit=1, window_seconds=60)
    limiter.record_failure("a")
    limiter.record_failure("b")
    limiter.reset("a")
    assert not limiter.is_blocked("a")
    assert limiter.is_blocked("b")
