import type { Layout, LayoutComponent } from "../theme/tokenTypes";

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    componentId: string;
    field: string;
    message: string;
  }>;
}

export function validateLayout(layout: Layout, formValues: Record<string, unknown>): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  for (const comp of layout.components) {
    validateComponent(comp, formValues, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateComponent(
  comp: LayoutComponent,
  formValues: Record<string, unknown>,
  errors: ValidationResult["errors"]
) {
  if (comp.type === "lov_select" && comp.required) {
    const name = (comp.name as string) ?? comp.id;
    const value = formValues[name];
    if (value === undefined || value === "" || value === null) {
      errors.push({
        componentId: comp.id,
        field: name,
        message: `${comp.label ?? name} is required`,
      });
    }
  }

  if (comp.type === "text_field" && comp.validation) {
    const name = (comp.name as string) ?? comp.id;
    const value = String(formValues[name] ?? "");
    const rules = comp.validation as Record<string, unknown>;

    if (rules.minLength && value.length < (rules.minLength as number)) {
      errors.push({
        componentId: comp.id,
        field: name,
        message: `Minimum length is ${rules.minLength}`,
      });
    }

    if (rules.maxLength && value.length > (rules.maxLength as number)) {
      errors.push({
        componentId: comp.id,
        field: name,
        message: `Maximum length is ${rules.maxLength}`,
      });
    }

    if (rules.pattern && !new RegExp(rules.pattern as string).test(value)) {
      errors.push({
        componentId: comp.id,
        field: name,
        message: (rules.message as string) ?? "Invalid format",
      });
    }
  }

  if (comp.children) {
    for (const child of comp.children) {
      validateComponent(child, formValues, errors);
    }
  }
}
