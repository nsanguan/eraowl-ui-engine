import type { Layout } from "./theme/tokenTypes";
import { componentRegistry } from "./registry/componentRegistry";
import { RuntimeThemeProvider } from "./theme/RuntimeThemeProvider";

interface UIRendererProps {
  layout: Layout;
  themeStyleName?: string;
}

export function UIRenderer({ layout, themeStyleName = "vita" }: UIRendererProps) {
  return (
    <RuntimeThemeProvider themeStyleName={themeStyleName}>
      <div className="eods-render-root" data-eut-theme={themeStyleName}>
        {layout.components.map((comp) => {
          const Component = componentRegistry[comp.type];
          if (!Component) {
            console.warn(`Unknown component type: ${comp.type}`);
            return null;
          }
          return <Component key={comp.id} {...comp} />;
        })}
      </div>
    </RuntimeThemeProvider>
  );
}
