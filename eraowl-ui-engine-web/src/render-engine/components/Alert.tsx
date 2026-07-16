import type { ReactNode } from 'react'

interface AlertProps {
  id?: string
  type?: "alert" | "Alert"
  title?: string
  message?: string
  alertType?: "info" | "success" | "warning" | "danger"
  dismissible?: boolean
  templateOptions?: Record<string, string | boolean | number>
  children?: ReactNode
  [key: string]: unknown
}

export function Alert({ id, title, message, alertType = "info", dismissible, templateOptions, children }: AlertProps) {
  const typeClass = `eut-alert--${alertType}`
  const dismissClass = dismissible ? 'eut-alert--dismissible' : ''

  return (
    <div id={id} data-eut-component="alert" className={`eut-alert ${typeClass} ${dismissClass}`} role="alert">
      {title && <div className="eut-alert__title">{title}</div>}
      <div className="eut-alert__body">{message || children}</div>
      {dismissible && <button className="eut-alert__dismiss" aria-label="Close">&times;</button>}
    </div>
  )
}
