interface BadgesListProps {
  id?: string
  type?: "badgesList" | "BadgesList"
  items?: Array<{ label: string; value: string | number; variant?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function BadgesList({ id, items = [] }: BadgesListProps) {
  return (
    <div id={id} data-eut-component="badgesList" className="eut-badges-list">
      {items.map((item, i) => (
        <span key={i} className={`eut-badge eut-badge--${item.variant ?? "neutral"}`}>
          {item.label}: <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  )
}
