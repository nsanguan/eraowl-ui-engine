interface ValueAttributePairsProps {
  id?: string
  type?: "valueAttributePairs" | "ValueAttributePairs"
  items?: Array<{ attribute: string; value: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function ValueAttributePairs({ id, items = [] }: ValueAttributePairsProps) {
  return (
    <div id={id} data-eut-component="valueAttributePairs" className="eut-vap">
      <dl className="eut-vap__list">
        {items.map((item, i) => (
          <div key={i} className="eut-vap__row">
            <dt className="eut-vap__attr">{item.attribute}</dt>
            <dd className="eut-vap__value">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
