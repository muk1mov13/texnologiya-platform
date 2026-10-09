import re
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{1,64}$")


def install_request_id(app: FastAPI) -> None:
    @app.middleware("http")
    async def add_request_id(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        incoming = request.headers.get("X-Request-ID", "")
        request_id = incoming if _VALID_REQUEST_ID.match(incoming) else uuid.uuid4().hex
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
