import type { ReactNode } from "react";
import { useState } from "react";

interface CollapsibleProps {
  id?: string;
  type?: "collapsible" | "Collapsible";
  label?: string;
  initialExpanded?: boolean;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Collapsible({ id, label, initialExpanded = false, children, templateOptions }: CollapsibleProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <div
      id={id}
      data-eut-component="collapsible"
      className={`eut-collapsible ${expanded ? "eut-collapsible--expanded" : ""}`}
    >
      <button
        className="eut-collapsible__toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="eut-collapsible__icon">{expanded ? "▼" : "▶"}</span>
        {label && <span className="eut-collapsible__label">{label}</span>}
      </button>
      {expanded && <div className="eut-collapsible__content">{children}</div>}
    </div>
  );
}
