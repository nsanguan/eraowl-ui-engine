interface NavItem {
  label: string;
  href?: string;
  active?: boolean;
  icon?: string;
}

interface NavigationBarProps {
  id?: string;
  type?: "navigation-bar" | "NavigationBar";
  items?: NavItem[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function NavigationBar({ id, items = [], templateOptions }: NavigationBarProps) {
  return (
    <nav
      id={id}
      data-eut-component="navigation-bar"
      className="eut-navigation-bar"
      role="navigation"
    >
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href ?? "#"}
          className={`eut-navigation-bar__item ${item.active ? "eut-navigation-bar__item--active" : ""}`}
        >
          {item.icon && <span className="eut-navigation-bar__item-icon">{item.icon}</span>}
          <span className="eut-navigation-bar__item-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
