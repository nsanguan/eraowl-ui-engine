interface TimelineProps {
  id?: string
  type?: "timeline" | "Timeline"
  items?: Array<{ date: string; title: string; description?: string; icon?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Timeline({ id, items = [] }: TimelineProps) {
  return (
    <div id={id} data-eut-component="timeline" className="eut-timeline">
      {items.map((item, i) => (
        <div key={i} className="eut-timeline__item">
          <div className="eut-timeline__marker">{item.icon && <span>{item.icon}</span>}</div>
          <div className="eut-timeline__content">
            <time className="eut-timeline__date">{item.date}</time>
            <h4 className="eut-timeline__title">{item.title}</h4>
            {item.description && <p className="eut-timeline__desc">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
