import type { ReactNode } from "react";

interface RegionProps {
  id: string;
  type: "region";
  label?: string;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean>;
  [key: string]: unknown;
}

export function Region({ id, label, children, templateOptions }: RegionProps) {
  const variant = templateOptions?.variant ?? "default";

  return (
    <section
      className={`eods-region eods-region--${variant}`}
      id={id}
      data-eut-component="region"
    >
      {label && <h3 className="eods-region__label">{label}</h3>}
      <div className="eods-region__body">{children}</div>
    </section>
  );
}
