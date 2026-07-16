import type { ReactNode } from "react";

interface HeroProps {
  id?: string;
  type?: "hero" | "Hero";
  title?: string;
  subtitle?: string;
  icon?: string;
  children?: ReactNode;
  actions?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Hero({ id, title, subtitle, icon, children, actions, templateOptions }: HeroProps) {
  return (
    <div
      id={id}
      data-eut-component="hero"
      className="eut-hero"
    >
      {icon && <div className="eut-hero__icon">{icon}</div>}
      <div className="eut-hero__content">
        {title && <h1 className="eut-hero__title">{title}</h1>}
        {subtitle && <p className="eut-hero__subtitle">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="eut-hero__actions">{actions}</div>}
    </div>
  );
}
