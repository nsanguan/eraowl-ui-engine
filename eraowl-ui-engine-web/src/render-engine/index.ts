// Public API surface for Library Mode (Target B §3.4)
// This is the entry point for `import { UIRenderer } from 'eraowl-ui-engine'`

export { UIRenderer } from "./UIRenderer";
export { RuntimeFormProvider } from "./RuntimeFormProvider";
export { RuntimeThemeProvider } from "./theme/RuntimeThemeProvider";
export { useFormState } from "./hooks/useFormState";
export { useCascadeQuery } from "./hooks/useCascadeQuery";
export { useThemeStyle } from "./hooks/useThemeStyle";
export { resolveTokens } from "./theme/tokenResolver";
export type {
  LayoutJson,
  ComponentProps,
  FormStatus,
  ThemeBundle,
  ThemeStyle,
  Token,
} from "./types";
export { componentRegistry } from "./registry/componentRegistry";
export { registerTheme } from "../themes";
