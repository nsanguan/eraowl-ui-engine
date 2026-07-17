"""
Tests for the TSX decompiler (reverse engineering) module — §8.5.

Covers:
- Full decompilation of a complex .tsx fixture
- Element-to-component mapping (Region, GridRow, GridColumn, form items, etc.)
- Style extraction (fontSize, fontColor)
- Data source detection (data-source-ref, hooks)
- Security path validation
- Error handling
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

from app.modules.ui_designer.codegen.decompiler import (
    ParseError,
    SecurityError,
    TsxDecompiler,
    _build_tree,
    _nest_into_regions,
    _resolve_element,
    _validate_file_path,
)

# ── Fixtures ─────────────────────────────────────────────────────────────

_FIXTURE_DIR = Path("/tmp/test-project")
_PROJECT_ROOT = str(_FIXTURE_DIR)
_FIXTURE_FILE = _FIXTURE_DIR / "apps/web/src/pages/manual/EmployeeForm.tsx"
_SIMPLE_FIXTURE = _FIXTURE_DIR / "apps/web/src/pages/manual/UserScreen.tsx"


def _require_node() -> None:
    """Skip test if Node.js is not available."""
    try:
        subprocess.run(["node", "--version"], capture_output=True, timeout=5)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pytest.skip("Node.js not available")


# ── Security / Path Validation ──────────────────────────────────────────


def test_validate_absolute_path_required() -> None:
    """file_path must be absolute."""
    with pytest.raises(SecurityError, match="must be an absolute path"):
        _validate_file_path("relative/path.tsx", _PROJECT_ROOT)


def test_validate_only_tsx_allowed() -> None:
    """Non-.tsx extensions are rejected."""
    with pytest.raises(SecurityError, match="Only .tsx files"):
        _validate_file_path("/tmp/test-project/foo.css", _PROJECT_ROOT)


def test_validate_not_under_project_root() -> None:
    """File outside project_root is rejected."""
    with pytest.raises(SecurityError, match="not under project_root"):
        _validate_file_path("/tmp/outside-project.tsx", _PROJECT_ROOT)


def test_validate_rejected_directories() -> None:
    """Paths containing node_modules, .git, etc. are rejected."""
    # Create a temp file under a rejected path to test the directory check
    rejected_path = _FIXTURE_DIR / "node_modules/some_lib/test.tsx"
    rejected_path.parent.mkdir(parents=True, exist_ok=True)
    rejected_path.write_text("// stub")
    try:
        with pytest.raises(SecurityError, match="rejected directory"):
            _validate_file_path(str(rejected_path), _PROJECT_ROOT)
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(str(rejected_path.parent.parent), ignore_errors=True)


def test_validate_nonexistent_file() -> None:
    """Non-existent file is rejected."""
    with pytest.raises(SecurityError, match="File does not exist"):
        _validate_file_path(
            str(_FIXTURE_DIR / "no_such_file.tsx"),
            _PROJECT_ROOT,
        )


def test_validate_valid_file() -> None:
    """A valid .tsx under project_root passes."""
    result = _validate_file_path(str(_FIXTURE_FILE), _PROJECT_ROOT)
    assert result.is_file()
    assert result.suffix == ".tsx"


# ── Element Resolution ───────────────────────────────────────────────────


def test_resolve_input_text() -> None:
    """Input text component extracts props into templateOptions and styles."""
    element = {
        "id": "rev-1",
        "tagName": "input",
        "componentType": "InputText",
        "className": None,
        "props": {
            "id": "emp_id",
            "placeholder": "Employee ID",
            "fontSize": "14px",
            "fontColor": "#333333",
        },
        "styles": {"fontSize": "14px", "color": "#333333"},
        "children": None,
        "selfClosing": True,
    }
    comp = _resolve_element(element)
    assert comp["type"] == "InputText"
    assert comp["id"] == "emp_id"
    # id and placeholder go into templateOptions (not in schema as top-level fields)
    assert comp["templateOptions"]["placeholder"] == "Employee ID"
    assert comp["templateOptions"]["id"] == "emp_id"
    # fontSize and fontColor go into styles
    assert comp["styles"]["fontSize"] == "14px"
    assert comp["styles"]["fontColor"] == "#333333"


def test_resolve_select_with_options() -> None:
    """Select component extracts options array."""
    element = {
        "id": "rev-2",
        "tagName": "select",
        "componentType": "Select",
        "props": {"id": "position", "label": "Position", "options": ["dev", "manager", "analyst"]},
        "styles": None,
        "children": None,
        "selfClosing": True,
    }
    comp = _resolve_element(element)
    assert comp["type"] == "Select"
    # options goes into templateOptions (not a schema top-level field)
    assert comp["templateOptions"]["options"] == ["dev", "manager", "analyst"]


def test_resolve_lov_select_with_datasource() -> None:
    """LovSelect component extracts dataSource ref."""
    element = {
        "id": "rev-3",
        "tagName": "LovSelect",
        "componentType": "LovSelect",
        "props": {
            "id": "department",
            "label": "Department",
            "dataSource": {
                "dataSourceRef": "lov:departments",
                "dataSourceType": "REGISTERED_QUERY",
            },
        },
        "styles": None,
        "children": None,
        "selfClosing": True,
    }
    comp = _resolve_element(element)
    assert comp["type"] == "LovSelect"
    # dataSource is at comp level, not inside props
    assert comp["dataSource"]["dataSourceRef"] == "lov:departments"


def test_resolve_button_with_styles() -> None:
    """Button component extracts inline styles."""
    element = {
        "id": "rev-4",
        "tagName": "button",
        "componentType": "Button",
        "props": {"id": "save_btn", "fontSize": "14px"},
        "styles": {"fontSize": "14px"},
        "children": [{"kind": "text", "value": "Save"}],
        "selfClosing": False,
    }
    comp = _resolve_element(element)
    assert comp["type"] == "Button"
    # fontSize goes into styles
    assert comp["styles"]["fontSize"] == "14px"


def test_resolve_region_with_title() -> None:
    """Region component extracts title from props into templateOptions."""
    element = {
        "id": "rev-10",
        "tagName": "div",
        "componentType": "Region",
        "className": "eods-region",
        "props": {"title": "Employee Information"},
        "styles": None,
        "children": [],
        "selfClosing": False,
    }
    comp = _resolve_element(element)
    assert comp["type"] == "Region"
    assert comp["templateOptions"]["title"] == "Employee Information"


def test_resolve_data_component() -> None:
    """Explicit data-component attribute maps to component type."""
    element = {
        "id": "rev-11",
        "tagName": "div",
        "componentType": "ClassicReport",
        "props": {"id": "employee_history"},
        "styles": None,
        "children": None,
        "selfClosing": True,
    }
    comp = _resolve_element(element)
    assert comp["type"] == "ClassicReport"
    assert comp["id"] == "employee_history"


# ── Tree Building ────────────────────────────────────────────────────────


def test_build_tree_flat() -> None:
    """A flat element list produces parent-linked components."""
    elements = [
        {
            "id": "rev-1",
            "tagName": "div",
            "componentType": "Region",
            "props": {"title": "Test"},
            "children": [
                {
                    "id": "rev-2",
                    "tagName": "div",
                    "componentType": "GridRow",
                    "props": {},
                    "children": [
                        {
                            "id": "rev-3",
                            "tagName": "div",
                            "componentType": "GridColumn",
                            "props": {},
                            "children": [
                                {
                                    "id": "rev-4",
                                    "tagName": "input",
                                    "componentType": "InputText",
                                    "props": {"id": "field1"},
                                    "children": None,
                                }
                            ],
                        }
                    ],
                }
            ],
        }
    ]
    result = _build_tree(elements)
    # Should have 4 components (Region, GridRow, GridColumn, InputText)
    assert len(result) == 4

    # Find the region
    region = next(c for c in result if c["type"] == "Region")
    assert region["templateOptions"]["title"] == "Test"

    # GridRow should be parented to Region
    grid_row = next(c for c in result if c["type"] == "GridRow")
    assert grid_row["parentId"] == region["id"]

    # GridColumn should be parented to GridRow
    grid_col = next(c for c in result if c["type"] == "GridColumn")
    assert grid_col["parentId"] == grid_row["id"]

    # InputText should be parented to GridColumn
    input_text = next(c for c in result if c["type"] == "InputText")
    assert input_text["parentId"] == grid_col["id"]


# ── Nesting ──────────────────────────────────────────────────────────────


def test_nest_into_regions() -> None:
    """Components with Region type become layout regions."""
    components = [
        {"id": "r1", "type": "Region", "templateOptions": {"title": "Main"}},
        {"id": "row1", "type": "GridRow", "parentId": "r1", "parent_id": "r1"},
        {"id": "col1", "type": "GridColumn", "parentId": "row1", "parent_id": "row1"},
        {"id": "inp1", "type": "InputText", "parentId": "col1", "parent_id": "col1"},
    ]
    regions = _nest_into_regions(components)
    assert len(regions) == 1
    assert regions[0]["title"] == "Main"
    assert len(regions[0]["components"]) == 1  # GridRow
    assert regions[0]["components"][0]["type"] == "GridRow"


# ── Full Decompilation (integration) ─────────────────────────────────────


def test_decompile_full_fixture() -> None:
    """End-to-end: parse EmployeeForm.tsx → validated layout_json."""
    _require_node()
    decompiler = TsxDecompiler()
    layout = decompiler.decompile(
        file_path=str(_FIXTURE_FILE),
        project_root=_PROJECT_ROOT,
    )

    # Must have schema version
    assert layout["schemaVersion"] == "1.0.0"
    assert len(layout["regions"]) >= 1

    # Find the Employee Information region
    region = next(r for r in layout["regions"] if r.get("title") == "Employee Information")
    assert region is not None

    # The region should have children (GridRow, Buttons, ClassicReport)
    assert len(region["components"]) >= 2

    # Find InputText component
    def find_comp(comps, comp_type, comp_id=None):
        for c in comps:
            if c["type"] == comp_type and (comp_id is None or c["id"] == comp_id):
                return c
            if "components" in c:
                found = find_comp(c["components"], comp_type, comp_id)
                if found:
                    return found
        return None

    # Check input field with fontColor
    emp_id = find_comp(region["components"], "InputText", "emp_id")
    assert emp_id is not None, "InputText 'emp_id' should exist"
    assert emp_id.get("styles", {}).get("fontColor") == "#333333"

    # Check Select with options
    position = find_comp(region["components"], "Select", "position")
    assert position is not None, "Select 'position' should exist"

    # Check ClassicReport
    report = find_comp(region["components"], "ClassicReport", "employee_history")
    assert report is not None, "ClassicReport 'employee_history' should exist"

    # Check Button
    save_btn = find_comp(region["components"], "Button", "save_btn")
    assert save_btn is not None, "Button 'save_btn' should exist"


def test_decompile_simple_fixture() -> None:
    """End-to-end: parse UserScreen.tsx → validated layout_json."""
    _require_node()
    decompiler = TsxDecompiler()
    layout = decompiler.decompile(
        file_path=str(_SIMPLE_FIXTURE),
        project_root=_PROJECT_ROOT,
    )

    assert layout["schemaVersion"] == "1.0.0"
    assert len(layout["regions"]) == 1
    assert layout["regions"][0]["title"] == "User Information"


def test_decompile_unknown_file() -> None:
    """Non-existent file raises ParseError."""
    _require_node()
    decompiler = TsxDecompiler()
    with pytest.raises((SecurityError, ParseError)):
        decompiler.decompile(
            file_path=str(_FIXTURE_DIR / "no_such_file.tsx"),
            project_root=_PROJECT_ROOT,
        )


def test_decompile_outside_root() -> None:
    """File outside project_root raises SecurityError."""
    _require_node()
    decompiler = TsxDecompiler()
    with pytest.raises(SecurityError):
        decompiler.decompile(
            file_path="/tmp/test-fixtures/EmployeeForm.tsx",
            project_root="/some/other/project",
        )


def test_decompile_non_tsx() -> None:
    """Non-.tsx file raises SecurityError."""
    _require_node()
    decompiler = TsxDecompiler()
    with pytest.raises(SecurityError):
        decompiler.decompile(
            file_path=str(_FIXTURE_DIR / "package.json"),
            project_root=_PROJECT_ROOT,
        )


# ── JSON Schema Compliance ───────────────────────────────────────────────


def test_layout_schema_compliance() -> None:
    """Generated layout must pass schema validation (additionalProperties: false)."""
    _require_node()
    from app.schema_validation.validator import validate_layout_json

    decompiler = TsxDecompiler()
    layout = decompiler.decompile(
        file_path=str(_FIXTURE_FILE),
        project_root=_PROJECT_ROOT,
    )

    # Must validate cleanly
    errors = validate_layout_json(layout)
    assert not errors, "Schema validation failed:\n" + "\n".join(errors)

    # Check no extra keys on components
    for region in layout["regions"]:
        for comp in region.get("components", []):
            allowed_keys = {
                "id", "type", "position", "props", "styles",
                "templateOptions", "components",
                "dataSource", "depends_on", "validation", "formBinding",
            }
            extra = set(comp.keys()) - allowed_keys
            assert not extra, f"Extra keys on component {comp['id']}: {extra}"
