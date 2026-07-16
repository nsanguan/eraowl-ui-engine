import type { ReactNode } from "react";

interface InlineDialogProps {
  id?: string;
  type?: "inline-dialog" | "InlineDialog";
  visible?: boolean;
  title?: string;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function InlineDialog({ id, visible = false, title, children, templateOptions }: InlineDialogProps) {
  if (!visible) return null;

  return (
    <div
      id={id}
      data-eut-component="inline-dialog"
      className="eut-inline-dialog"
      role="dialog"
    >
      <div className="eut-inline-dialog__overlay" />
      <div className="eut-inline-dialog__panel">
        {title && <div className="eut-inline-dialog__title">{title}</div>}
        <div className="eut-inline-dialog__body">{children}</div>
      </div>
    </div>
  );
}
