import { useQuery } from '@tanstack/react-query'

export function useThemeStyle(styleRef: string | undefined) {
  return useQuery({
    queryKey: ['theme-style', styleRef],
    queryFn: async () => {
      if (!styleRef) return null
      const [themeId, styleKey] = styleRef.split('.')
      const response = await fetch(`/api/v1/themes/${themeId}/styles/${styleKey}`)
      if (!response.ok) return null
      return response.json()
    },
    enabled: !!styleRef,
    staleTime: 60_000,
  })
}
