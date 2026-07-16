interface BadgeProps {
  id?: string
  type?: "badge" | "Badge"
  label?: string
  variant?: "info" | "success" | "warning" | "danger" | "neutral"
  size?: "sm" | "md"
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Badge({ id, label, variant = "neutral", size = "md", children }: BadgeProps) {
  return (
    <span id={id} data-eut-component="badge" className={`eut-badge eut-badge--${variant} eut-badge--${size}`}>
      {label || children}
    </span>
  )
}
