interface IconButtonProps {
  id?: string;
  type?: "iconButton" | "IconButton";
  icon?: string;
  name?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function IconButton({ id, icon, name, templateOptions }: IconButtonProps) {
  const variant = templateOptions?.variant ?? "default";
  const size = templateOptions?.size ?? "medium";

  return (
    <button
      id={id}
      name={name ?? id}
      data-eut-component="iconButton"
      className={`eods-icon-button eods-icon-button--${variant} eods-icon-button--${size}`}
      type="button"
      aria-label={name ?? "icon-button"}
    >
      {icon ?? "⚙"}
    </button>
  );
}
