import type { ReactNode } from "react";

interface FlexboxContainerProps {
  id?: string;
  type?: "flexbox-container" | "FlexboxContainer";
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function FlexboxContainer({ id, children, templateOptions }: FlexboxContainerProps) {
  const direction = (templateOptions?.direction as string) ?? "row";
  const align = (templateOptions?.align as string) ?? "stretch";
  const justify = (templateOptions?.justify as string) ?? "flex-start";
  const gap = (templateOptions?.gap as string) ?? "0";

  const style: Record<string, string> = {
    display: "flex",
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap,
  };

  return (
    <div
      id={id}
      data-eut-component="flexbox-container"
      className="eut-flexbox-container"
      style={style}
    >
      {children}
    </div>
  );
}
