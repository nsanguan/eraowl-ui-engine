interface CardTemplatesProps {
  id?: string
  type?: "cardTemplates" | "CardTemplates"
  items?: Array<{ title: string; description?: string; icon?: string; href?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function CardTemplates({ id, items = [] }: CardTemplatesProps) {
  return (
    <div id={id} data-eut-component="cardTemplates" className="eut-card-templates">
      {items.map((item, i) => (
        <a key={i} href={item.href ?? '#'} className="eut-card-template">
          {item.icon && <span className="eut-card-template__icon">{item.icon}</span>}
          <h3 className="eut-card-template__title">{item.title}</h3>
          {item.description && <p className="eut-card-template__desc">{item.description}</p>}
        </a>
      ))}
    </div>
  )
}
