import type { ThemeStyle, Tokens } from "../render-engine/theme/tokenTypes";

const themeRegistry = new Map<string, ThemeStyle>();

export function registerTheme(theme: ThemeStyle) {
  themeRegistry.set(theme.name, theme);
}

export function getTheme(name: string): ThemeStyle | undefined {
  return themeRegistry.get(name);
}

export function listThemes(): ThemeStyle[] {
  return Array.from(themeRegistry.values());
}

// ── Pre-register known theme styles at build time ──────────────────────────
// Static imports avoid the dynamic-import-in-library-mode problem: Vite's
// bundler can resolve import('./eut/styles/vita.json') at build time.
// Dynamic import is only used as a fallback for unknown/runtime-added styles.
import vita from "./eut/styles/vita.json";
import vitaRed from "./eut/styles/vita-red.json";
import vitaSlate from "./eut/styles/vita-slate.json";

const _BUILTIN_THEMES: Record<string, ThemeStyle> = {
  "eut.vita": vita as ThemeStyle,
  "eut.vita-red": vitaRed as ThemeStyle,
  "eut.vita-slate": vitaSlate as ThemeStyle,
};

// Register all built-in themes immediately
for (const [name, theme] of Object.entries(_BUILTIN_THEMES)) {
  theme.name = name;
  registerTheme(theme);
}

export async function themeLoader(name: string): Promise<ThemeStyle> {
  const cached = themeRegistry.get(name);
  if (cached) return cached;

  // Fallback: try dynamic import for non-registered themes
  try {
    const module = await import(`./eut/styles/${name}.json`);
    const theme = (module.default ?? module) as ThemeStyle;
    theme.name = name;
    registerTheme(theme);
    return theme;
  } catch {
    throw new Error(`Theme style "${name}" not found`);
  }
}

export async function loadBaseTokens(): Promise<Tokens> {
  const module = await import("./eut/tokens.base.json");
  return (module.default ?? module) as Tokens;
}

export async function loadTemplateOptions(): Promise<Record<string, Record<string, unknown>>> {
  const module = await import("./eut/templateOptions.json");
  return (module.default ?? module) as Record<string, Record<string, unknown>>;
}
