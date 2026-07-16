import type { ReactNode } from "react";

interface ContentRowProps {
  id?: string;
  type?: "content-row" | "ContentRow";
  label?: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  selectionType?: "checkbox" | "radio";
  children?: ReactNode;
  actions?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function ContentRow({ id, label, description, icon, selected, selectionType, children, actions, templateOptions }: ContentRowProps) {
  return (
    <div
      id={id}
      data-eut-component="content-row"
      className="eut-content-row"
    >
      {selectionType && (
        <div className="eut-content-row__selection">
          {selectionType === "checkbox" ? (
            <input type="checkbox" checked={selected} readOnly className="eut-content-row__checkbox" />
          ) : (
            <input type="radio" checked={selected} readOnly className="eut-content-row__radio" />
          )}
        </div>
      )}
      {icon && <div className="eut-content-row__icon">{icon}</div>}
      <div className="eut-content-row__content">
        {label && <div className="eut-content-row__label">{label}</div>}
        {description && <div className="eut-content-row__description">{description}</div>}
        {children}
      </div>
      {actions && <div className="eut-content-row__actions">{actions}</div>}
    </div>
  );
}
