interface LinkEntry {
  label: string;
  href?: string;
  icon?: string;
  badge?: string | number;
  target?: string;
}

interface LinksListProps {
  id?: string;
  type?: "links-list" | "LinksList";
  links?: LinkEntry[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function LinksList({ id, links = [], templateOptions }: LinksListProps) {
  return (
    <div
      id={id}
      data-eut-component="links-list"
      className="eut-links-list"
    >
      {links.length === 0 && <div className="eut-links-list__empty">No links</div>}
      {links.map((link, i) => (
        <a
          key={i}
          href={link.href ?? "#"}
          target={link.target}
          className="eut-links-list__item"
        >
          {link.icon && <span className="eut-links-list__item-icon">{link.icon}</span>}
          <span className="eut-links-list__item-label">{link.label}</span>
          {link.badge != null && (
            <span className="eut-links-list__item-badge">{link.badge}</span>
          )}
        </a>
      ))}
    </div>
  );
}
