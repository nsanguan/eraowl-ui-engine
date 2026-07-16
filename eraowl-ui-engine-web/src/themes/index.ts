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

export async function themeLoader(name: string): Promise<ThemeStyle> {
  const cached = themeRegistry.get(name);
  if (cached) return cached;

  try {
    const module = await import(`./eut/styles/${name}.json`);
    const theme = (module.default ?? module) as ThemeStyle;
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
