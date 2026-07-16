import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockFormValues: Record<string, unknown> = {}
const mockTouched: Record<string, boolean> = {}

vi.mock('../../store/useRenderStore', () => ({
  useRenderStore: Object.assign(
    (selector: (s: { formValues: Record<string, unknown>; touched: Record<string, boolean> }) => unknown) =>
      selector({ formValues: mockFormValues, touched: mockTouched }),
    { getState: () => ({ formValues: mockFormValues, touched: mockTouched }) }
  ),
}))

import { useDependsOn } from '../hooks/useDependsOn'

beforeEach(() => {
  Object.keys(mockFormValues).forEach(key => delete mockFormValues[key])
  Object.keys(mockTouched).forEach(key => delete mockTouched[key])
  vi.clearAllMocks()
})

describe('useDependsOn', () => {
  it('returns dependencyValues from formValues', () => {
    mockFormValues.country = 'US'
    mockFormValues.state = 'CA'
    const { result } = renderHook(() => useDependsOn(['country', 'state']))
    expect(result.current.dependencyValues).toEqual({ country: 'US', state: 'CA' })
  })

  it('returns allDefined true when all fields have values', () => {
    mockFormValues.country = 'US'
    mockFormValues.state = 'CA'
    const { result } = renderHook(() => useDependsOn(['country', 'state']))
    expect(result.current.allDefined).toBe(true)
  })

  it('returns allDefined false when a field is undefined', () => {
    mockFormValues.country = 'US'
    mockFormValues.state = undefined
    const { result } = renderHook(() => useDependsOn(['country', 'state']))
    expect(result.current.allDefined).toBe(false)
  })

  it('returns allDefined false when a field is empty string', () => {
    mockFormValues.country = 'US'
    mockFormValues.state = ''
    const { result } = renderHook(() => useDependsOn(['country', 'state']))
    expect(result.current.allDefined).toBe(false)
  })

  it('returns hasChanged true when a field is touched and defined', () => {
    mockFormValues.country = 'US'
    mockTouched.country = true
    const { result } = renderHook(() => useDependsOn(['country']))
    expect(result.current.hasChanged).toBe(true)
  })

  it('returns hasChanged false when no field is touched', () => {
    mockFormValues.country = 'US'
    mockTouched.country = false
    const { result } = renderHook(() => useDependsOn(['country']))
    expect(result.current.hasChanged).toBe(false)
  })

  it('returns hasChanged false when touched but value is undefined', () => {
    mockTouched.country = true
    const { result } = renderHook(() => useDependsOn(['country']))
    expect(result.current.hasChanged).toBe(false)
  })
})
