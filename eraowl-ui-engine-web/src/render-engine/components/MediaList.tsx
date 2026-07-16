interface MediaListProps {
  id?: string
  type?: "mediaList" | "MediaList"
  items?: Array<{ title: string; description?: string; icon?: string; badge?: string | number }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function MediaList({ id, items = [] }: MediaListProps) {
  return (
    <div id={id} data-eut-component="mediaList" className="eut-media-list">
      {items.map((item, i) => (
        <div key={i} className="eut-media-list__item">
          {item.icon && <span className="eut-media-list__icon">{item.icon}</span>}
          <div className="eut-media-list__body">
            <h4 className="eut-media-list__title">{item.title}</h4>
            {item.description && <p className="eut-media-list__desc">{item.description}</p>}
          </div>
          {item.badge != null && <span className="eut-media-list__badge">{item.badge}</span>}
        </div>
      ))}
    </div>
  )
}
