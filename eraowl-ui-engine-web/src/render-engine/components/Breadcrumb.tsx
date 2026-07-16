interface BreadcrumbProps {
  id?: string
  type?: "breadcrumb" | "Breadcrumb"
  items?: Array<{ label: string; href?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Breadcrumb({ id, items = [] }: BreadcrumbProps) {
  return (
    <nav id={id} data-eut-component="breadcrumb" className="eut-breadcrumb" aria-label="Breadcrumb">
      <ol className="eut-breadcrumb__list">
        {items.map((item, i) => (
          <li key={i} className="eut-breadcrumb__item">
            {item.href && i < items.length - 1 ? (
              <a href={item.href} className="eut-breadcrumb__link">{item.label}</a>
            ) : (
              <span className="eut-breadcrumb__current" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
