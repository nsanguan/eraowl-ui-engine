import type { ReactNode } from "react";

interface StandardProps {
  id?: string;
  type?: "standard" | "Standard";
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Standard({ id, children, templateOptions }: StandardProps) {
  return (
    <div
      id={id}
      data-eut-component="standard"
      className="eut-standard"
    >
      {children}
    </div>
  );
}
