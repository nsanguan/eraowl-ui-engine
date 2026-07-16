interface StaticContentProps {
  id?: string;
  type?: "static-content" | "StaticContent";
  body?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function StaticContent({ id, body, templateOptions }: StaticContentProps) {
  return (
    <div
      id={id}
      data-eut-component="static-content"
      className="eut-static-content"
      dangerouslySetInnerHTML={body ? { __html: body } : undefined}
    />
  );
}
