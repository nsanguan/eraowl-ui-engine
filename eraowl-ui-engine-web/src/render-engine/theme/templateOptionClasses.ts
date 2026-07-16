import type { TemplateOptions } from './tokenTypes'

export function templateOptionClasses(options: TemplateOptions): string[] {
  const classes: string[] = []
  for (const [key, value] of Object.entries(options)) {
    classes.push(`eut-opt-${key}-${value}`)
  }
  return classes
}
