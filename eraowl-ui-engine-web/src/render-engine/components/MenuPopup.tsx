import type { ReactNode } from "react";

interface MenuPopupProps {
  id?: string;
  type?: "menu-popup" | "MenuPopup";
  visible?: boolean;
  children?: ReactNode;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function MenuPopup({ id, visible = false, children, templateOptions }: MenuPopupProps) {
  if (!visible) return null;

  return (
    <div
      id={id}
      data-eut-component="menu-popup"
      className="eut-menu-popup"
      role="menu"
    >
      <div className="eut-menu-popup__content">
        {children}
      </div>
    </div>
  );
}
