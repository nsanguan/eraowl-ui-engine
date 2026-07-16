import type { ReactNode } from "react";

interface ListViewItem {
  key: string;
  primary?: string;
  secondary?: string;
  icon?: string;
  badge?: string | number;
  href?: string;
}

interface ListViewProps {
  id?: string;
  type?: "list-view" | "ListView";
  items?: ListViewItem[];
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function ListView({ id, items = [], children, templateOptions }: ListViewProps) {
  return (
    <div
      id={id}
      data-eut-component="list-view"
      className="eut-list-view"
    >
      {items.map((item) => (
        <div key={item.key} className="eut-list-view__item">
          {item.icon && <div className="eut-list-view__item-icon">{item.icon}</div>}
          <div className="eut-list-view__item-content">
            <div className="eut-list-view__item-primary">{item.primary}</div>
            {item.secondary && <div className="eut-list-view__item-secondary">{item.secondary}</div>}
          </div>
          {item.badge != null && <div className="eut-list-view__item-badge">{item.badge}</div>}
        </div>
      ))}
      {children}
    </div>
  );
}
