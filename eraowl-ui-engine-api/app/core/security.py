"""JWT decode helpers and role-based access-control dependency."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_bearer = HTTPBearer()

# Placeholder – integrate real JWT decode (e.g. PyJWT / python-jose)
# from jose import jwt


def decode_token(token: str) -> dict:
    """Decode and validate a JWT access token.

    TODO: implement real verification with ``settings.JWT_SECRET_KEY``.
    """
    # return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return {"sub": "anonymous", "roles": ["viewer"]}


async def get_current_user(
    cred: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    try:
        payload = decode_token(cred.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


def require_role(*allowed_roles: str):
    """Return a dependency that enforces RBAC."""

    async def _check(
        user: Annotated[dict, Depends(get_current_user)],
    ) -> dict:
        user_roles: list[str] = user.get("roles", [])
        if not any(r in allowed_roles for r in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {allowed_roles}",
            )
        return user

    return _check
