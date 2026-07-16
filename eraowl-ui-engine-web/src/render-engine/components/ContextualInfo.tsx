interface ContextualInfoProps {
  id?: string
  type?: "contextualInfo" | "ContextualInfo"
  items?: Array<{ label: string; value: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function ContextualInfo({ id, items = [] }: ContextualInfoProps) {
  return (
    <div id={id} data-eut-component="contextualInfo" className="eut-contextual-info">
      {items.map((item, i) => (
        <div key={i} className="eut-contextual-info__row">
          <dt className="eut-contextual-info__label">{item.label}</dt>
          <dd className="eut-contextual-info__value">{item.value}</dd>
        </div>
      ))}
    </div>
  )
}
