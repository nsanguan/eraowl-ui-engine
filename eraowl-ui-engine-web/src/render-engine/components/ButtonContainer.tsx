import type { ReactNode } from "react";

interface ButtonContainerProps {
  id?: string;
  type?: "button-container" | "ButtonContainer";
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function ButtonContainer({ id, children, templateOptions }: ButtonContainerProps) {
  const align = (templateOptions?.align as string) ?? "left";

  return (
    <div
      id={id}
      data-eut-component="button-container"
      className={`eut-button-container eut-button-container--${align}`}
    >
      {children}
    </div>
  );
}
