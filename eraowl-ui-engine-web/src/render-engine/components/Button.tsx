interface ButtonProps {
  id?: string;
  type?: "button" | "Button";
  label?: string;
  name?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Button({ id, label, name, templateOptions }: ButtonProps) {
  const variant = templateOptions?.variant ?? "primary";
  const size = templateOptions?.size ?? "medium";

  return (
    <button
      id={id}
      name={name ?? id}
      data-eut-component="button"
      className={`eods-button eods-button--${variant} eods-button--${size}`}
      type="button"
    >
      {label ?? "Button"}
    </button>
  );
}
