import type { ReactNode } from 'react'

interface FormFieldProps {
  id?: string
  type?: "formField" | "FormField"
  label?: string
  helpText?: string
  required?: boolean
  templateOptions?: Record<string, string | boolean | number>
  children?: ReactNode
  [key: string]: unknown
}

export function FormField({ id, label, helpText, required, children }: FormFieldProps) {
  return (
    <div id={id} data-eut-component="formField" className={`eut-form-field${required ? ' eut-form-field--required' : ''}`}>
      {label && <label className="eut-form-field__label">{label}{required && <span className="eut-required">*</span>}</label>}
      <div className="eut-form-field__control">{children}</div>
      {helpText && <p className="eut-form-field__help">{helpText}</p>}
    </div>
  )
}
