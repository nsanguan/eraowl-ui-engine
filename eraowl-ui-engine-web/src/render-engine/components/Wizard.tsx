import type { ReactNode } from 'react'

interface WizardProps {
  id?: string
  type?: "wizard" | "Wizard"
  steps?: Array<{ title: string; status?: "current" | "completed" | "pending" }>
  currentStep?: number
  templateOptions?: Record<string, string | boolean | number>
  children?: ReactNode
  [key: string]: unknown
}

export function Wizard({ id, steps = [], currentStep = 0, children }: WizardProps) {
  return (
    <div id={id} data-eut-component="wizard" className="eut-wizard">
      {steps.length > 0 && (
        <ol className="eut-wizard__steps">
          {steps.map((step, i) => (
            <li key={i} className={`eut-wizard__step eut-wizard__step--${step.status ?? (i === currentStep ? 'current' : i < currentStep ? 'completed' : 'pending')}`}>
              <span className="eut-wizard__step-icon">{i < currentStep ? '✓' : i + 1}</span>
              <span className="eut-wizard__step-title">{step.title}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="eut-wizard__content">{children}</div>
    </div>
  )
}
