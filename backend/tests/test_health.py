import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app


async def test_health_returns_ok() -> None:
    app = create_app(Settings(env="test", jwt_secret="h" * 40))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_prod_requires_real_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(env="prod")
