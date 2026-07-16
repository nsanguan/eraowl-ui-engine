interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
  items?: MenuItem[];
}

interface MenuBarProps {
  id?: string;
  type?: "menu-bar" | "MenuBar";
  items?: MenuItem[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function MenuBar({ id, items = [], templateOptions }: MenuBarProps) {
  return (
    <div
      id={id}
      data-eut-component="menu-bar"
      className="eut-menu-bar"
      role="menubar"
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={`eut-menu-bar__item ${item.disabled ? "eut-menu-bar__item--disabled" : ""}`}
          role="none"
        >
          <a
            href={item.href ?? "#"}
            className="eut-menu-bar__item-link"
            role="menuitem"
            aria-disabled={item.disabled}
          >
            {item.icon && <span className="eut-menu-bar__item-icon">{item.icon}</span>}
            <span className="eut-menu-bar__item-label">{item.label}</span>
          </a>
        </div>
      ))}
    </div>
  );
}
