import type { LayoutJson, Component } from '../types'

interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export function formValidator(
  layout: LayoutJson,
  formValues: Record<string, unknown>
): ValidationResult {
  const errors: Record<string, string[]> = {}

  // Walk the component tree recursively, handling nested containers
  // (GridRow → GridColumn → InputText etc.)
  function walkComponents(components: Component[]): void {
    for (const comp of components) {
      if (!comp.validation) {
        // Still recurse into containers even without validation rules
        if (Array.isArray((comp as unknown as { components?: Component[] }).components)) {
          walkComponents((comp as unknown as { components: Component[] }).components)
        }
        continue
      }
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
        if (pattern.length > 200) {
          fieldErrors.push('Invalid format')
        } else {
          try {
            const regex = new RegExp(pattern)
            if (!regex.test(value)) {
              fieldErrors.push('Invalid format')
            }
          } catch {
            fieldErrors.push('Invalid format')
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[comp.id] = fieldErrors
      }

      // Recurse into nested children (containers: Region → GridRow → GridColumn etc.)
      if (Array.isArray((comp as unknown as { components?: Component[] }).components)) {
        walkComponents((comp as unknown as { components: Component[] }).components)
      }
    }
  }

  for (const region of layout.regions) {
    walkComponents(region.components)
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
