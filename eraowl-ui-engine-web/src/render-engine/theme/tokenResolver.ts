import type { Tokens, ThemeStyle, TemplateOptions } from "./tokenTypes";

export function resolveTokens(
  baseTokens: Tokens,
  themeStyle?: ThemeStyle,
  componentStyleRef?: string,
  templateOptions?: TemplateOptions
): Tokens {
  let resolved = { ...baseTokens };

  if (themeStyle?.overrides) {
    resolved = { ...resolved, ...themeStyle.overrides };
  }

  if (componentStyleRef && themeStyle?.componentOverrides?.[componentStyleRef]) {
    resolved = { ...resolved, ...themeStyle.componentOverrides[componentStyleRef] };
  }

  if (templateOptions) {
    const classMapping = templateOptionClasses(templateOptions);
    if (classMapping.additionalTokens) {
      resolved = { ...resolved, ...classMapping.additionalTokens };
    }
  }

  return resolved;
}

function templateOptionClasses(options: TemplateOptions): {
  classes: string[];
  additionalTokens?: Tokens;
} {
  const classes: string[] = [];
  const additionalTokens: Tokens = {};

  for (const [key, value] of Object.entries(options)) {
    classes.push(`eut-opt-${key}-${value}`);
    if (typeof value === "string" && value.startsWith("--")) {
      additionalTokens[key] = value;
    }
  }

  return { classes, additionalTokens };
}
