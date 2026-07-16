import type { ReactNode } from "react";

interface TitleBarProps {
  id?: string;
  type?: "title-bar" | "TitleBar";
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  actions?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function TitleBar({ id, title, breadcrumbs, children, actions, templateOptions }: TitleBarProps) {
  const crumbs = breadcrumbs ?? [];

  return (
    <div
      id={id}
      data-eut-component="title-bar"
      className="eut-title-bar"
    >
      {crumbs.length > 0 && (
        <nav className="eut-title-bar__breadcrumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={i} className="eut-title-bar__crumb">
              {crumb.href ? (
                <a href={crumb.href} className="eut-title-bar__crumb-link">{crumb.label}</a>
              ) : (
                <span className="eut-title-bar__crumb-current">{crumb.label}</span>
              )}
              {i < crumbs.length - 1 && <span className="eut-title-bar__crumb-sep">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="eut-title-bar__row">
        {title && <h1 className="eut-title-bar__title">{title}</h1>}
        {children}
        {actions && <div className="eut-title-bar__actions">{actions}</div>}
      </div>
    </div>
  );
}
