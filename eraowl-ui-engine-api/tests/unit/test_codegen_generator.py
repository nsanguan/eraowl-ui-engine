"""Tests for the codegen generator — §8 Code Generation.

The generator must produce valid JSX with proper nesting for containers
(Region → GridRow → GridColumn → InputText).
"""

from __future__ import annotations

from app.modules.ui_designer.codegen.generator import CodeGenerator


def test_generate_page_nested_jsx() -> None:
    """Container components emit nested children inline."""
    page_data = {
        "layout_json": {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "main_region",
                    "title": "Main",
                    "components": [
                        {
                            "id": "form_grid",
                            "type": "GridRow",
                            "position": {"x": 0, "y": 0, "width": 800, "height": 60},
                            "components": [
                                {
                                    "id": "col_left",
                                    "type": "GridColumn",
                                    "position": {"x": 0, "y": 0, "width": 400, "height": 60},
                                    "components": [
                                        {
                                            "id": "username",
                                            "type": "InputText",
                                            "position": {"x": 0, "y": 0, "width": 200, "height": 40},
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    }

    gen = CodeGenerator(project_root="/fake/root", target_subpath="apps/web/src/pages/generated")
    files = gen.generate_page(page_data)

    # Each component should have a file
    assert "apps/web/src/pages/generated/form_grid.tsx" in files
    assert "apps/web/src/pages/generated/col_left.tsx" in files
    assert "apps/web/src/pages/generated/username.tsx" in files

    # The container's JSX should reference its children inline via data-component
    form_grid_jsx = files["apps/web/src/pages/generated/form_grid.tsx"]
    assert "data-component=\"form_grid\"" in form_grid_jsx
    # Should contain its child's data attribute (nesting)
    assert "data-component=\"col_left\"" in form_grid_jsx

    col_left_jsx = files["apps/web/src/pages/generated/col_left.tsx"]
    assert "data-component=\"col_left\"" in col_left_jsx
    assert "data-component=\"username\"" in col_left_jsx

    # Leaf component (InputText) should be self-closing (no children)
    username_jsx = files["apps/web/src/pages/generated/username.tsx"]
    assert "data-component=\"username\"" in username_jsx
    assert "data-type=\"InputText\"" in username_jsx


def test_generate_page_leaf_component() -> None:
    """A single button component generates a standalone file."""
    page_data = {
        "layout_json": {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "r1",
                    "title": "Actions",
                    "components": [
                        {
                            "id": "save_btn",
                            "type": "Button",
                            "position": {"x": 0, "y": 0, "width": 120, "height": 40},
                            "templateOptions": {"variant": "primary", "size": "medium"},
                        },
                    ],
                },
            ],
        },
    }

    gen = CodeGenerator(project_root="/fake/root", target_subpath="apps/web/src/pages/generated")
    files = gen.generate_page(page_data)

    assert "apps/web/src/pages/generated/save_btn.tsx" in files
    jsx = files["apps/web/src/pages/generated/save_btn.tsx"]

    # Leaf component should be self-closing (/>)
    assert "/>" in jsx
    # Should include template options (JSX uses {{ }} for object literals)
    assert "templateOptions={{" in jsx
    assert '"variant": "primary"' in jsx
    assert '"size": "medium"' in jsx
    # Should include data-type label
    assert "data-type=\"Button\"" in jsx


def test_generate_page_style_ref_propagation() -> None:
    """Components with styleRef emit the attribute in JSX."""
    page_data = {
        "layout_json": {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "r1",
                    "title": "Test",
                    "components": [
                        {
                            "id": "styled_card",
                            "type": "Card",
                            "position": {"x": 0, "y": 0, "width": 300, "height": 200},
                            "styleRef": "eut.vita-red",
                        },
                    ],
                },
            ],
        },
    }

    gen = CodeGenerator(project_root="/fake/root", target_subpath="apps/web/src/pages/generated")
    files = gen.generate_page(page_data)
    jsx = files["apps/web/src/pages/generated/styled_card.tsx"]

    assert "styleRef=\"eut.vita-red\"" in jsx


def test_generate_page_empty_regions() -> None:
    """Empty regions produce no generated files."""
    page_data = {
        "layout_json": {
            "schemaVersion": "1.0.0",
            "regions": [],
        },
    }

    gen = CodeGenerator(project_root="/fake/root", target_subpath="apps/web/src/pages/generated")
    files = gen.generate_page(page_data)
    assert files == {}


def test_generate_component_legacy_api() -> None:
    """The legacy generate_component API still works (delegation)."""
    gen = CodeGenerator(project_root="/fake/root", target_subpath="apps/web/src/pages/generated")
    result = gen.generate_component(
        {"id": "test_comp", "type": "Button", "position": {"x": 0, "y": 0, "width": 100, "height": 40}},
        {},
    )
    assert "data-component=\"test_comp\"" in result
    assert "data-type=\"Button\"" in result
