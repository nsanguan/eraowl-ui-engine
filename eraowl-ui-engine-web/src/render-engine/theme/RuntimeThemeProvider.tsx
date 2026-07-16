import { type ReactNode, useMemo } from 'react'
import type { Tokens } from './tokenTypes'
import { resolveTokens } from './tokenResolver'

interface RuntimeThemeProviderProps {
  themeTokens: Tokens
  styleRef?: string
  children: ReactNode
}

export function RuntimeThemeProvider({
  themeTokens,
  styleRef,
  children,
}: RuntimeThemeProviderProps) {
  const resolvedTokens = useMemo(
    () => resolveTokens(themeTokens, undefined, styleRef),
    [themeTokens, styleRef]
  )

  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {}
    for (const [category, tokens] of Object.entries(resolvedTokens)) {
      if (typeof tokens === 'object' && tokens !== null) {
        for (const [key, value] of Object.entries(tokens)) {
          vars[`--eut-${category}-${key}`] = String(value)
        }
      }
    }
    return vars
  }, [resolvedTokens])

  return (
    <div data-eut-theme={styleRef ?? 'default'} style={cssVars}>
      {children}
    </div>
  )
}
