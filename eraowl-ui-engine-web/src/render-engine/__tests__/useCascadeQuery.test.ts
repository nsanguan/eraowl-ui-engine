import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockFormValues: Record<string, unknown> = {}

vi.mock('../../store/useRenderStore', () => ({
  useRenderStore: Object.assign(
    (selector: (s: { formValues: Record<string, unknown> }) => unknown) => selector({ formValues: mockFormValues }),
    { getState: () => ({ formValues: mockFormValues }) }
  ),
}))

let mockQueryResult: unknown = { items: [] }
let mockQueryIsLoading = false

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options: { enabled?: boolean; queryKey: unknown[]; queryFn: () => Promise<unknown> }) => ({
    data: mockQueryResult,
    isLoading: mockQueryIsLoading,
    error: null,
    enabled: options.enabled,
    queryKey: options.queryKey,
  })),
}))

import { useCascadeQuery } from '../hooks/useCascadeQuery'

beforeEach(() => {
  Object.keys(mockFormValues).forEach(key => delete mockFormValues[key])
  mockQueryResult = { items: [] }
  mockQueryIsLoading = false
  vi.clearAllMocks()
})

describe('useCascadeQuery', () => {
  it('returns enabled: false when sourceId is empty', () => {
    const { result } = renderHook(() => useCascadeQuery('', []))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(false)
  })

  it('returns enabled: false when dependsOn values are missing', () => {
    mockFormValues.country = undefined
    const { result } = renderHook(() => useCascadeQuery('cities', ['country']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(false)
  })

  it('returns enabled: true when all dependsOn values are resolved', () => {
    mockFormValues.country = 'US'
    const { result } = renderHook(() => useCascadeQuery('cities', ['country']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(true)
  })

  it('includes dependsOn values in query params', () => {
    mockFormValues.country = 'US'
    mockFormValues.state = 'CA'
    const { result } = renderHook(() => useCascadeQuery('cities', ['country', 'state']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryKey = (result.current as any).queryKey as unknown[]
    const params = queryKey[2] as Record<string, string>
    expect(params.country).toBe('US')
    expect(params.state).toBe('CA')
  })

  it('treats empty string as missing dependency', () => {
    mockFormValues.country = ''
    const { result } = renderHook(() => useCascadeQuery('cities', ['country']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(false)
  })

  it('returns loading state from query', () => {
    mockQueryIsLoading = true
    mockFormValues.country = 'US'
    const { result } = renderHook(() => useCascadeQuery('cities', ['country']))
    expect(result.current.isLoading).toBe(true)
  })
})
