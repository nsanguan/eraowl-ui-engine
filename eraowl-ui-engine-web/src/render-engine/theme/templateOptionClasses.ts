import type { TemplateOptions } from "./tokenTypes";

interface OptionClassResult {
  classes: string[];
  additionalTokens: Record<string, string>;
}

export function templateOptionClasses(options: TemplateOptions): OptionClassResult {
  const classes: string[] = [];
  const additionalTokens: Record<string, string> = {};

  for (const [key, value] of Object.entries(options)) {
    if (typeof value === "boolean") {
      if (value) classes.push(`eut-opt-${key}`);
    } else {
      classes.push(`eut-opt-${key}-${value}`);
    }
  }

  return { classes, additionalTokens };
}
