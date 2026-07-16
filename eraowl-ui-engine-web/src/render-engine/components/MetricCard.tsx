interface MetricCardProps {
  id?: string
  type?: "metricCard" | "MetricCard"
  label?: string
  value?: number | string
  icon?: string
  trend?: "up" | "down" | "neutral"
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function MetricCard({ id, label, value, icon, trend = "neutral" }: MetricCardProps) {
  return (
    <div id={id} data-eut-component="metricCard" className={`eut-metric eut-metric--${trend}`}>
      {icon && <span className="eut-metric__icon">{icon}</span>}
      <div className="eut-metric__body">
        {label && <div className="eut-metric__label">{label}</div>}
        <div className="eut-metric__value">{value ?? 0}</div>
      </div>
    </div>
  )
}
