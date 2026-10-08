import pytest

from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_temp_password,
    hash_password,
    hash_token,
    new_refresh_token,
    verify_password,
)

SETTINGS = Settings(env="test", jwt_secret="s" * 40)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("parol1234")
    assert hashed != "parol1234"
    assert verify_password("parol1234", hashed)
    assert not verify_password("boshqa-parol", hashed)


def test_verify_password_handles_garbage_hash() -> None:
    assert not verify_password("parol1234", "not-a-hash")


def test_access_token_roundtrip() -> None:
    token = create_access_token(42, "teacher", SETTINGS)
    assert decode_access_token(token, SETTINGS) == 42


def test_expired_access_token_is_rejected() -> None:
    expired = Settings(env="test", jwt_secret="s" * 40, access_token_minutes=-1)
    token = create_access_token(42, "student", expired)
    with pytest.raises(AppError) as exc:
        decode_access_token(token, SETTINGS)
    assert exc.value.status_code == 401
    assert exc.value.code == "INVALID_TOKEN"


def test_token_signed_with_other_secret_is_rejected() -> None:
    token = create_access_token(1, "student", Settings(env="test", jwt_secret="o" * 40))
    with pytest.raises(AppError):
        decode_access_token(token, SETTINGS)


def test_refresh_tokens_are_random_and_hash_is_stable() -> None:
    first, second = new_refresh_token(), new_refresh_token()
    assert first != second
    assert hash_token(first) == hash_token(first)
    assert len(hash_token(first)) == 64


def test_temp_password_is_readable() -> None:
    password = generate_temp_password()
    assert len(password) == 10
    assert not set(password) & set("0O1lI")
