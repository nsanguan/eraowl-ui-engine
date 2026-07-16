"""Unit tests for owner-scoping helpers (§6.3 RBAC tenant/owner scoping)."""

import uuid

import pytest

from app.core.security import is_admin, user_id
from app.modules.ui_designer.service import _as_owner_uuid


class TestSecurityHelpers:
    def test_user_id_from_sub(self):
        assert user_id({"sub": "abc"}) == "abc"

    def test_user_id_missing(self):
        assert user_id({}) is None

    def test_is_admin_true(self):
        assert is_admin({"roles": ["ui_designer.admin"]}) is True

    def test_is_admin_false(self):
        assert is_admin({"roles": ["ui_designer.editor"]}) is False

    def test_is_admin_no_roles(self):
        assert is_admin({}) is False


class TestOwnerUuidCoercion:
    def test_valid_uuid(self):
        u = str(uuid.uuid4())
        assert _as_owner_uuid(u) == uuid.UUID(u)

    def test_invalid_uuid(self):
        with pytest.raises(ValueError, match="not a valid UUID"):
            _as_owner_uuid("not-a-uuid")

    def test_none(self):
        assert _as_owner_uuid(None) is None
