import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

let mockQueryResult: unknown = null
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

vi.stubGlobal('fetch', vi.fn())

import { useThemeStyle } from '../hooks/useThemeStyle'

beforeEach(() => {
  mockQueryResult = null
  mockQueryIsLoading = false
  vi.clearAllMocks()
})

describe('useThemeStyle', () => {
  it('returns enabled: false when styleRef is undefined', () => {
    const { result } = renderHook(() => useThemeStyle(undefined))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(false)
  })

  it('returns enabled: false when styleRef is empty string', () => {
    const { result } = renderHook(() => useThemeStyle(''))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(false)
  })

  it('returns enabled: true when styleRef is provided', () => {
    const { result } = renderHook(() => useThemeStyle('eut.vita-red'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as any).enabled).toBe(true)
  })

  it('includes styleRef in queryKey', () => {
    const { result } = renderHook(() => useThemeStyle('eut.vita-red'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryKey = (result.current as any).queryKey as unknown[]
    expect(queryKey).toContain('eut.vita-red')
  })

  it('returns loading state from query', () => {
    mockQueryIsLoading = true
    const { result } = renderHook(() => useThemeStyle('eut.vita-red'))
    expect(result.current.isLoading).toBe(true)
  })

  it('returns data from query', () => {
    mockQueryResult = { overrides: { color: { accent: '#ff0000' } } }
    const { result } = renderHook(() => useThemeStyle('eut.vita-red'))
    expect(result.current.data).toEqual({ overrides: { color: { accent: '#ff0000' } } })
  })
})
