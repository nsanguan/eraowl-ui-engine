import type { ReactNode } from "react";

interface CardProps {
  id?: string;
  type?: "card" | "Card";
  title?: string;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Card({ id, title, children, templateOptions }: CardProps) {
  const variant = templateOptions?.variant ?? "default";

  return (
    <div id={id} data-eut-component="card" className={`eods-card eods-card--${variant}`}>
      {title && <div className="eods-card__title">{title}</div>}
      <div className="eods-card__body">{children}</div>
    </div>
  );
}
