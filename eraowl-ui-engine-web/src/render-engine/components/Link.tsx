interface LinkProps {
  id?: string;
  type?: "link" | "Link";
  label?: string;
  href?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Link({ id, label, href, templateOptions }: LinkProps) {
  const variant = templateOptions?.variant ?? "default";

  return (
    <a
      id={id}
      data-eut-component="link"
      className={`eods-link eods-link--${variant}`}
      href={href ?? "#"}
    >
      {label ?? "Link"}
    </a>
  );
}
