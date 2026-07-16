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

      if (comp.validation.required && (value === undefined || value === '')) {
        fieldErrors.push('This field is required')
      }

      if (comp.validation.minLength !== undefined && typeof value === 'string' && value.length < comp.validation.minLength) {
        fieldErrors.push(`Minimum length is ${comp.validation.minLength}`)
      }

      if (comp.validation.maxLength !== undefined && typeof value === 'string' && value.length > comp.validation.maxLength) {
        fieldErrors.push(`Maximum length is ${comp.validation.maxLength}`)
      }

      if (comp.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(comp.validation.pattern)
        if (!regex.test(value)) {
          fieldErrors.push('Invalid format')
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
