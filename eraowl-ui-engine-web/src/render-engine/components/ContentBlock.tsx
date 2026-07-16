import type { ReactNode } from "react";

interface ContentBlockProps {
  id?: string;
  type?: "content-block" | "ContentBlock";
  title?: string;
  body?: string;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function ContentBlock({ id, title, body, children, templateOptions }: ContentBlockProps) {
  return (
    <div
      id={id}
      data-eut-component="content-block"
      className="eut-content-block"
    >
      {title && <div className="eut-content-block__title">{title}</div>}
      {body && <div className="eut-content-block__body">{body}</div>}
      {children && <div className="eut-content-block__children">{children}</div>}
    </div>
  );
}
