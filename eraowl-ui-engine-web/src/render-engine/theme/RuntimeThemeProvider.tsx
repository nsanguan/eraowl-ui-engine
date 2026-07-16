import type { ReactNode } from "react";
import { useResolvedTokens } from "../hooks/useResolvedTokens";

interface RuntimeThemeProviderProps {
  themeStyleName: string;
  children: ReactNode;
}

export function RuntimeThemeProvider({
  themeStyleName,
  children,
}: RuntimeThemeProviderProps) {
  const tokens = useResolvedTokens(themeStyleName);

  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    style[`--eut-${key}`] = String(value);
  }

  return (
    <div
      className="eods-runtime-theme-provider"
      data-eut-theme={themeStyleName}
      style={style as React.CSSProperties}
    >
      {children}
    </div>
  );
}
