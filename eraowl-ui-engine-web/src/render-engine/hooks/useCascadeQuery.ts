import { useQuery } from '@tanstack/react-query'
import { useRenderStore } from '../../store/useRenderStore'
import { apiClient } from '../../api/client'

interface LovItem {
  label: string
  value: string
}

interface ResolverResponse {
  data: LovItem[]
}

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
      const response = await apiClient.post<ResolverResponse>(
        '/v1/resolvers/resolve',
        {
          resolver_name: sourceId,
          params,
        }
      )
      return {
        items: (response.data ?? []) as LovItem[],
      }
    },
    enabled: !!sourceId && allResolved,
    staleTime: 60_000,
  })
}
