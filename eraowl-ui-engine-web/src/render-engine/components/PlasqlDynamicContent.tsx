interface PlasqlDynamicContentProps {
  id?: string;
  type?: "plasql-dynamic-content" | "PlasqlDynamicContent";
  html?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function PlasqlDynamicContent({ id, html, templateOptions }: PlasqlDynamicContentProps) {
  return (
    <div
      id={id}
      data-eut-component="plasql-dynamic-content"
      className="eut-plasql-dynamic-content"
      dangerouslySetInnerHTML={html ? { __html: html } : undefined}
    />
  );
}
