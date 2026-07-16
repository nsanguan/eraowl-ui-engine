"""JWT decode helpers and role-based access-control dependency.

§6.3 — Every endpoint requires Auth/RBAC middleware.
§6.1 — ResolverRegistry is the only way to fetch data (no raw SQL).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

_bearer = HTTPBearer(auto_error=False)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT access token.

    Raises JWTError on invalid/expired token.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


async def get_current_user(
    cred: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )
    try:
        payload = decode_token(cred.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


def require_role(*allowed_roles: str):
    """Return a dependency that enforces RBAC.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("ui_designer.admin"))])
    """

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
