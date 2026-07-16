import type { ReactNode } from "react";

interface HelpTextProps {
  id?: string;
  type?: "help-text" | "HelpText";
  children?: ReactNode;
  message?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function HelpText({ id, children, message, templateOptions }: HelpTextProps) {
  return (
    <div
      id={id}
      data-eut-component="help-text"
      className="eut-help-text"
    >
      {message && <p className="eut-help-text__message">{message}</p>}
      {children}
    </div>
  );
}
