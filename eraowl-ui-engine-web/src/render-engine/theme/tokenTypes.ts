export interface Tokens {
  [key: string]: string | number | Tokens
}

export interface ThemeTokens {
  [key: string]: Record<string, string | number> | undefined
}

export interface ThemeStyle {
  name: string
  displayName: string
  baseStyle: string
  overrides?: Tokens
  componentOverrides?: Record<string, Tokens>
}

export interface TemplateOptions {
  [key: string]: string | boolean
}

export interface LayoutComponent {
  id: string
  type: string
  styleRef?: string
  templateOptions?: TemplateOptions
  dependsOn?: string[]
  children?: LayoutComponent[]
  [key: string]: unknown
}

export interface Layout {
  id: string
  name: string
  version: number
  components: LayoutComponent[]
  metadata?: Record<string, unknown>
}

export interface Page {
  id: string
  name: string
  layoutId: string
  themeStyle?: string
  metadata?: Record<string, unknown>
}

export interface LovSource {
  sourceId: string
  items: Array<{ label: string; value: string }>
}
