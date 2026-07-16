import type { LayoutJson } from '../types'

interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export function formValidator(
  layout: LayoutJson,
  formValues: Record<string, unknown>
): ValidationResult {
  const errors: Record<string, string[]> = {}

  for (const region of layout.regions) {
    for (const comp of region.components) {
      if (!comp.validation) continue
      const value = formValues[comp.id]
      const fieldErrors: string[] = []

      if (comp.validation.required && (value === undefined || value === '' || (Array.isArray(value) && value.length === 0))) {
        fieldErrors.push('This field is required')
      }

      if (comp.validation.minLength !== undefined && typeof value === 'string' && value.length < comp.validation.minLength) {
        fieldErrors.push(`Minimum length is ${comp.validation.minLength}`)
      }

      if (comp.validation.maxLength !== undefined && typeof value === 'string' && value.length > comp.validation.maxLength) {
        fieldErrors.push(`Maximum length is ${comp.validation.maxLength}`)
      }

      if (comp.validation.min !== undefined && typeof value === 'number' && value < comp.validation.min) {
        fieldErrors.push(`Minimum value is ${comp.validation.min}`)
      }

      if (comp.validation.max !== undefined && typeof value === 'number' && value > comp.validation.max) {
        fieldErrors.push(`Maximum value is ${comp.validation.max}`)
      }

      if (comp.validation.pattern && typeof value === 'string') {
        const pattern = comp.validation.pattern
        // Cap pattern length to limit ReDoS surface; reject oversized patterns.
        if (pattern.length > 200) {
          fieldErrors.push('Invalid format')
        } else {
          try {
            const regex = new RegExp(pattern)
            if (!regex.test(value)) {
              fieldErrors.push('Invalid format')
            }
          } catch {
            // Invalid/unsafe pattern → treat as no-match rather than throwing.
            fieldErrors.push('Invalid format')
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[comp.id] = fieldErrors
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
