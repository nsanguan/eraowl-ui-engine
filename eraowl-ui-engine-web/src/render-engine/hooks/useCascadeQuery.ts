import { useQuery } from '@tanstack/react-query'
import { useRenderStore } from '../../store/useRenderStore'

export function useCascadeQuery(sourceId: string, dependsOn: string[]) {
  const formValues = useRenderStore((s) => s.formValues)

  const params: Record<string, string> = dependsOn.reduce(
    (acc, name) => {
      acc[name] = String(formValues[name] ?? '')
      return acc
    },
    {} as Record<string, string>
  )

  const allResolved = dependsOn.every(
    (name) => formValues[name] !== undefined && formValues[name] !== ''
  )

  return useQuery({
    queryKey: ['lov', sourceId, params],
    queryFn: async () => {
      return { items: [] as Array<{ label: string; value: string }> }
    },
    enabled: !!sourceId && allResolved,
    staleTime: 60_000,
  })
}
