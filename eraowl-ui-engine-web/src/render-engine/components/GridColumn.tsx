import type { ReactNode } from "react";

interface GridColumnProps {
  id?: string;
  type?: "gridColumn" | "GridColumn";
  span?: number;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function GridColumn({ id, span, children, templateOptions }: GridColumnProps) {
  const colSpan = span ?? (typeof templateOptions?.span === "number" ? templateOptions.span : 1);

  return (
    <div
      id={id}
      data-eut-component="gridColumn"
      className="eods-grid-column"
      style={{ flex: `1 1 ${100 / Math.max(colSpan, 1)}%`, minWidth: 0 }}
    >
      {children}
    </div>
  );
}
