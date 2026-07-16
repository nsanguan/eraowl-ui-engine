import type { ReactNode } from "react";

interface GridRowProps {
  id?: string;
  type?: "gridRow" | "GridRow";
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function GridRow({ id, children, templateOptions }: GridRowProps) {
  const gap = String(templateOptions?.gap ?? "1rem");
  const align = String(templateOptions?.align ?? "stretch");

  return (
    <div
      id={id}
      data-eut-component="gridRow"
      className="eods-grid-row"
      style={{ display: "flex", flexDirection: "row", gap, alignItems: align as React.CSSProperties["alignItems"], width: "100%" }}
    >
      {children}
    </div>
  );
}
