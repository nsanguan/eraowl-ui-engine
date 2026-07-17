"""
AST-based TSX-to-layout_json decompiler — §8.5 Reverse Engineering.

Scans a legacy .tsx file, calls the Node.js AST parser (tsx-decompiler.mjs)
to extract JSX elements, then transforms them into the EraOwl layout_json
format. The layout is validated against layout_schema_v1.json before return.

Usage (via decompile() or CLI subprocess):
    decompiler = TsxDecompiler()
    layout = decompiler.decompile(file_path, project_root)
"""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import uuid
from pathlib import Path
from typing import Any

from app.schema_validation.validator import validate_layout_json

logger = logging.getLogger(__name__)

# ── Node.js parser script path (resolved relative to this package root) ──
_SCRIPT_DIR = Path(__file__).resolve().parents[5] / "eraowl-ui-engine-web" / "scripts"
_DEFAULT_PARSER = _SCRIPT_DIR / "tsx-decompiler.mjs"

# ── Security: allowed path patterns for file reading ──
_REJECTED_PATH_COMPONENTS = re.compile(
    r"(?:^|/)(?:"
    r"node_modules|\.git|\.env(?:$|/)|dist|build|"
    r"__pycache__|\.venv|\.next|\.cache"
    r")(?:/|$)",
    re.IGNORECASE,
)

# ── Component type hierarchy (determines parent-child nesting rules) ──
_CONTAINER_TYPES: set[str] = {
    "Region", "Standard", "GridRow", "GridColumn",
    "FlexboxContainer", "ContentBlock", "ContentRow",
    "TabsContainer", "Collapsible", "InlineDialog",
    "ButtonContainer", "TitleBar", "Hero", "Wizard",
}
_GRID_CHILDREN: set[str] = {"GridRow", "GridColumn", "FlexboxContainer"}

# ── Helper: generate stable-ish IDs ──
_id_counter: int = 0


def _next_id() -> str:
    global _id_counter
    _id_counter += 1
    return f"rev-{_id_counter}-{uuid.uuid4().hex[:6]}"


def _slug(value: str) -> str:
    """Sanitise a string into a safe layout_json id."""
    slug = re.sub(r"[^A-Za-z0-9_-]", "", value)
    return slug or _next_id()


class SecurityError(Exception):
    """Raised when a file path violates security constraints."""


class ParseError(Exception):
    """Raised when the TSX parser fails."""


class ValidationError(Exception):
    """Raised when the generated layout fails schema validation."""


def _resolve_parser_script() -> Path:
    """Return the path to the Node.js parser script."""
    candidate = _DEFAULT_PARSER
    return candidate if candidate.is_file() else Path(__file__).parent / "tsx-decompiler.mjs"


def _validate_file_path(file_path: str, project_root: str) -> Path:
    """
    Security validation:
    - Must be an absolute path
    - Must reside under project_root
    - Must have .tsx extension
    - Must not traverse via symlinks or '..'
    - Must not match rejected patterns (node_modules, .git, etc.)
    """
    raw = Path(file_path)
    if not raw.is_absolute():
        raise SecurityError(f"file_path must be an absolute path, got: {file_path}")

    # Resolve to eliminate symlinks, '..', etc.
    try:
        resolved = raw.resolve(strict=False)
    except OSError as exc:
        raise SecurityError(f"Cannot resolve path: {file_path}: {exc}") from exc

    # Must have .tsx extension
    if resolved.suffix not in (".tsx", ".ts"):
        raise SecurityError(f"Only .tsx files can be decompiled, got: {resolved.suffix}")

    # Must be under project_root
    root = Path(project_root).resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise SecurityError(
            f"file_path {file_path} is not under project_root {project_root}"
        ) from exc

    # Check rejected path components
    rel = str(resolved.relative_to(root))
    if _REJECTED_PATH_COMPONENTS.search(rel):
        raise SecurityError(
            f"file_path contains a rejected directory pattern: {file_path}"
        )

    if not resolved.is_file():
        raise SecurityError(f"File does not exist: {file_path}")

    return resolved


def _call_node_parser(file_path: Path) -> dict[str, Any]:
    """Invoke tsx-decompiler.mjs via Node.js subprocess."""
    parser = _resolve_parser_script()
    if not parser.is_file():
        raise ParseError(
            f"Parser script not found at {parser}. "
            f"Ensure 'node_modules/@babel/parser' and scripts/tsx-decompiler.mjs exist."
        )

    node_bin = os.environ.get("NODE_BIN") or "node"
    try:
        result = subprocess.run(
            [node_bin, str(parser), "--file", str(file_path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        raise ParseError(
            f"Node.js parser timed out after 30s on {file_path}"
        ) from None
    except FileNotFoundError:
        raise ParseError(
            f"Node.js executable '{node_bin}' not found. "
            f"Set NODE_BIN env var or ensure node is on PATH."
        ) from None

    if result.returncode != 0:
        error_detail = result.stderr.strip() or "(no stderr)"
        raise ParseError(f"Parser failed on {file_path}: {error_detail}")

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise ParseError(
            f"Parser returned invalid JSON for {file_path}: {exc}"
        ) from exc


# ── Element → Component Translation ──────────────────────────────────────

_PARAM_ATTRS: set[str] = {"label", "id", "placeholder", "title", "name"}


def _resolve_element(element: dict[str, Any]) -> dict[str, Any]:
    """Map an AST element node to a partial layout_json component object.

    Returns a component dict with keys: id, type, position, styles, dataSource,
    templateOptions, etc. — all conforming to layout_schema_v1.json.
    Does NOT emit ``props`` (not in schema).
    """
    comp_type: str = element.get("componentType") or "ContentBlock"
    raw_props: dict[str, Any] = element.get("props") or {}
    comp_id: str = _slug(raw_props.get("id") or element["id"])

    template_options: dict[str, Any] = {}
    comp_styles: dict[str, str] | None = None
    data_source: dict[str, Any] | None = None

    # Map recognized raw_props → schema fields
    for key, value in raw_props.items():
        if key == "dataSource" and isinstance(value, dict):
            data_source = value
        elif key in ("fontSize", "fontColor"):
            # Promote to styles
            if comp_styles is None:
                comp_styles = {}
            comp_styles[key] = value
        else:
            # Everything else goes into templateOptions
            template_options[key] = value

    # Merge inline styles from AST element
    raw_styles: dict[str, str] | None = element.get("styles")
    if raw_styles:
        if comp_styles is None:
            comp_styles = {}
        # Map CSS 'color' → 'fontColor'
        for k, v in raw_styles.items():
            if k == "color" and v.startswith("#"):
                comp_styles["fontColor"] = v
            elif k in ("fontSize", "fontColor") and k not in comp_styles:
                comp_styles[k] = v

    comp: dict[str, Any] = {
        "id": comp_id,
        "type": comp_type,
        "position": {"x": 0, "y": 0, "width": 200, "height": 40},
    }

    if template_options:
        comp["templateOptions"] = template_options
    if comp_styles:
        comp["styles"] = comp_styles
    if data_source:
        comp["dataSource"] = data_source

    return comp


# ── Tree Building ────────────────────────────────────────────────────────


def _build_tree(
    elements: list[dict[str, Any]],
    parent_type: str | None = None,
    depth: int = 0,
) -> list[dict[str, Any]]:
    """Convert AST element list into a flat, parent-linked component list.

    Rules:
    - Region, Standard → root-level region items
    - GridRow → child of Region; GridColumn → child of GridRow
    - All other components → children of the current container
    - Leaf components (form/data/action) → children of GridColumn or Region
    - Text-only elements are skipped

    Returns a list of all components in this subtree (flattened).
    """
    components: list[dict[str, Any]] = []
    position_x = 0
    position_y = 0

    for element in elements:
        if element.get("kind") == "text":
            continue  # skip bare text nodes

        comp_type: str = element.get("componentType") or "ContentBlock"

        # Children from the element tree
        raw_children: list[dict[str, Any]] = element.get("children") or []

        # Resolve current component
        comp = _resolve_element(element)
        comp_id: str = comp["id"]
        comp["position"] = {"x": position_x, "y": position_y, "width": 200, "height": 40}

        # Collect descendant elements (exclude text nodes)
        descendant_elements: list[dict[str, Any]] = [
            c for c in raw_children if c.get("kind") != "text" and c.get("componentType")
        ]

        if descendant_elements:
            # Recurse: returns ALL components in the child subtree
            child_components = _build_tree(descendant_elements, comp_type, depth + 1)

            # Identify the immediate children (first-level descendants)
            immediate_children = [
                c for c in child_components
                if c.get("parentId") is None and c.get("parent_id") is None
            ]

            # Set parentId on immediate children only (preserve grandchild parentIds)
            for child in immediate_children:
                child["parentId"] = comp_id
                child["parent_id"] = comp_id

            components.extend(child_components)

        components.append(comp)
        position_y += 10  # basic vertical spacing

    return components


# ── Re-nest into Region / Grid hierarchy ─────────────────────────────────

_REGION_TYPES: set[str] = {"Region", "Standard"}
_STRUCTURAL_TYPES: set[str] = {"GridRow", "GridColumn", "FlexboxContainer"}


def _nest_into_regions(components: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build a layout_json-compatible regions array from a flat component list.

    Strategy:
    1. Find root-level components (no parentId, or grandparent of all).
    2. Components with type Region/Standard become regions.
    3. Everything else under a region's parentId tree gets nested in the region.
    """
    # Index by id
    comp_by_id: dict[str, dict[str, Any]] = {}
    for comp in components:
        comp_by_id[comp["id"]] = comp

    # Find region roots (components whose immediate parent is a region)
    region_roots: list[dict[str, Any]] = [
        c for c in components
        if c["type"] in _REGION_TYPES and c.get("parentId") is None
    ]

    # If no explicit regions found, wrap everything in a default region
    if not region_roots:
        orphan_ids = {
            c["id"] for c in components
            if c.get("parentId") is None and c["type"] not in _REGION_TYPES
        }
        if orphan_ids:
            default_id = "default_region"
            region_roots.append({
                "id": default_id,
                "type": "Region",
                "title": "Imported Page",
                "position": {"x": 0, "y": 0, "width": 800, "height": 400},
            })
            # Assign orphans to the default region
            for c in components:
                if c["id"] in orphan_ids:
                    c.pop("parentId", None)
                    c.pop("parent_id", None)

    # Build output regions
    regions_out: list[dict[str, Any]] = []
    for region in region_roots:
        region_id: str = region["id"]
        title: str = region.get("templateOptions", {}).get("title") or region.get("title") or region_id
        region_out: dict[str, Any] = {
            "id": region_id,
            "title": title,
        }

        # Build the nested component tree for this region
        child_list = _build_output_tree(region_id, components)
        region_out["components"] = child_list
        regions_out.append(region_out)

    return regions_out


def _build_output_tree(
    parent_id: str,
    all_components: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Recursively build nested component tree for a parent."""
    children = [
        c for c in all_components
        if c.get("parentId") == parent_id or c.get("parent_id") == parent_id
    ]
    result: list[dict[str, Any]] = []
    for child in children:
        entry: dict[str, Any] = {
            "id": child["id"],
            "type": child["type"],
            "position": child.get("position", {"x": 0, "y": 0, "width": 200, "height": 40}),
        }
        for key in ("styles", "templateOptions", "dataSource", "depends_on", "validation", "formBinding"):
            if key in child:
                entry[key] = child[key]

        # Recurse grandchildren
        grandchildren = _build_output_tree(child["id"], all_components)
        if grandchildren:
            entry["components"] = grandchildren

        result.append(entry)
    return result


# ── Public API ───────────────────────────────────────────────────────────


class TsxDecompiler:
    """Reverse engineering engine: TSX → layout_json."""

    def __init__(self, parser_script: str | Path | None = None) -> None:
        self._parser_script = Path(parser_script) if parser_script else _resolve_parser_script()

    def decompile(
        self,
        file_path: str,
        project_root: str,
    ) -> dict[str, Any]:
        """Decompile a .tsx file into a layout_json structure.

        Args:
            file_path: Absolute path to the .tsx file to decompile.
            project_root: Absolute path to the target project root (for security validation).

        Returns:
            A validated ``layout_json`` dict conforming to layout_schema_v1.json.

        Raises:
            SecurityError: If the path violates security rules.
            ParseError: If the TSX parser returns invalid data.
            ValidationError: If the output fails schema validation.
        """
        # 1. Security — path validation
        resolved = _validate_file_path(file_path, project_root)
        logger.info("Decompiling: %s (under %s)", resolved, project_root)

        # 2. Parse — call Node.js AST parser
        raw = _call_node_parser(resolved)

        elements: list[dict[str, Any]] = raw.get("elements", [])
        hooks: list[dict[str, Any]] = raw.get("hooks", [])
        imports: list[dict[str, Any]] = raw.get("imports", [])

        if not elements:
            raise ParseError(
                f"No JSX elements found in {file_path}. "
                "The file may not contain JSX or may be malformed."
            )

        logger.info(
            "Parser returned %d elements, %d hooks, %d imports",
            len(elements), len(hooks), len(imports),
        )

        # 3. Transform — element tree → flat component list
        flat_components = _build_tree(elements)

        # Merge data source info from hooks into matching components
        self._merge_hooks_into_components(flat_components, hooks)

        # 4. Build regions
        regions = _nest_into_regions(flat_components)

        if not regions:
            # Fallback: wrap the whole tree in a default region
            child_tree = _build_output_tree("__root__", flat_components)
            regions = [
                {
                    "id": "default_region",
                    "title": "Imported Page",
                    "components": child_tree,
                }
            ]

        layout: dict[str, Any] = {
            "schemaVersion": "1.0.0",
            "regions": regions,
        }

        # 5. Validate against JSON Schema
        errors = validate_layout_json(layout)
        if errors:
            logger.warning(
                "Layout generated from %s failed schema validation: %s",
                file_path,
                errors,
            )
            raise ValidationError(
                "Generated layout failed schema validation:\n" + "\n".join(errors)
            )

        logger.info(
            "Successfully decompiled %s → %d regions, %d total components",
            file_path,
            len(regions),
            len(flat_components),
        )

        return layout

    @staticmethod
    def _merge_hooks_into_components(
        components: list[dict[str, Any]],
        hooks: list[dict[str, Any]],
    ) -> None:
        """Cross-reference detected hooks with component dataSource.

        If a hook name (e.g. 'lov:roles') appears in a component's id or
        templateOptions, attach the dataSource metadata at comp level.
        """
        hook_map: dict[str, dict[str, Any]] = {}
        for hook in hooks:
            ref: str = hook.get("dataSourceRef", "")
            if ref:
                hook_map[ref] = hook

        for comp in components:
            comp_id: str = comp.get("id", "")
            comp_opts: dict[str, Any] = comp.get("templateOptions") or {}

            # Skip if already has a dataSource at comp level
            if comp.get("dataSource") and isinstance(comp["dataSource"], dict):
                continue

            # Check if component id matches a hook dataSourceRef
            if comp_id in hook_map:
                comp["dataSource"] = {
                    "dataSourceRef": comp_id,
                    "dataSourceType": "REGISTERED_QUERY",
                }
                continue

            # Also check templateOptions for reference to any hook
            for val in comp_opts.values():
                if isinstance(val, str) and val in hook_map:
                    comp["dataSource"] = {
                        "dataSourceRef": val,
                        "dataSourceType": "REGISTERED_QUERY",
                    }
                    break


# ── Convenience function ────────────────────────────────────────────────


def decompile(file_path: str, project_root: str) -> dict[str, Any]:
    """Shortcut: create a decompiler and run it."""
    return TsxDecompiler().decompile(file_path, project_root)
