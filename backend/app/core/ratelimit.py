import time
from collections import defaultdict, deque
from collections.abc import Callable


class InMemoryRateLimiter:
    """Kalit bo'yicha muvaffaqiyatsiz urinishlarni sirpanuvchi oynada sanaydi.

    Faqat bitta jarayon uchun (lokal muhit). Prod'da Redis versiyasi bilan almashtiriladi.
    """

    def __init__(
        self, limit: int, window_seconds: int, clock: Callable[[], float] = time.monotonic
    ) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._clock = clock
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _recent(self, key: str) -> deque[float]:
        failures = self._failures[key]
        cutoff = self._clock() - self.window_seconds
        while failures and failures[0] <= cutoff:
            failures.popleft()
        return failures

    def is_blocked(self, key: str) -> bool:
        return len(self._recent(key)) >= self.limit

    def record_failure(self, key: str) -> None:
        self._recent(key).append(self._clock())

    def reset(self, key: str) -> None:
        self._failures.pop(key, None)
