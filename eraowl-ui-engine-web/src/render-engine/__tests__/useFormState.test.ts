import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockState = {
  formValues: {} as Record<string, unknown>,
  touched: {} as Record<string, boolean>,
  errors: {} as Record<string, string>,
  submitState: 'idle' as 'idle' | 'validating' | 'ready' | 'submitting' | 'error',
  setFieldValue: vi.fn((name: string, value: unknown) => {
    mockState.formValues = { ...mockState.formValues, [name]: value }
    mockState.touched = { ...mockState.touched, [name]: true }
  }),
  setFieldTouched: vi.fn((name: string, isTouched: boolean) => {
    mockState.touched = { ...mockState.touched, [name]: isTouched }
  }),
  setErrors: vi.fn((errors: Record<string, string>) => {
    mockState.errors = errors
  }),
  setSubmitState: vi.fn((state: 'idle' | 'validating' | 'ready' | 'submitting' | 'error') => {
    mockState.submitState = state
  }),
  reset: vi.fn(() => {
    mockState.formValues = {}
    mockState.touched = {}
    mockState.errors = {}
    mockState.submitState = 'idle'
  }),
  broadcast: vi.fn(),
}

const mockSetFieldValue = mockState.setFieldValue
const mockSetFieldTouched = mockState.setFieldTouched
const mockSetErrors = mockState.setErrors
const mockSetSubmitState = mockState.setSubmitState
const mockReset = mockState.reset

vi.mock('../../store/useRenderStore', () => ({
  useRenderStore: Object.assign(
    (selector: (s: typeof mockState) => unknown) => selector(mockState),
    {
      getState: () => ({
        ...mockState,
        setFieldValue: mockSetFieldValue,
        setFieldTouched: mockSetFieldTouched,
        setErrors: mockSetErrors,
        setSubmitState: mockSetSubmitState,
        reset: mockReset,
        broadcast: vi.fn(),
      }),
    }
  ),
}))

import { useFormState } from '../hooks/useFormState'

beforeEach(() => {
  mockState.formValues = {}
  mockState.touched = {}
  mockState.errors = {}
  mockState.submitState = 'idle'
  vi.clearAllMocks()
})

describe('useFormState', () => {
  it('returns initial form values', () => {
    const { result } = renderHook(() => useFormState())
    expect(result.current.formValues).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.errors).toEqual({})
    expect(result.current.submitState).toBe('idle')
  })

  it('setFieldValue delegates to store', () => {
    const { result } = renderHook(() => useFormState())
    result.current.setFieldValue('name', 'John')
    expect(mockSetFieldValue).toHaveBeenCalledWith('name', 'John')
  })

  it('setFieldTouched delegates to store', () => {
    const { result } = renderHook(() => useFormState())
    result.current.setFieldTouched('email', true)
    expect(mockSetFieldTouched).toHaveBeenCalledWith('email', true)
  })

  it('setErrors delegates to store', () => {
    const { result } = renderHook(() => useFormState())
    const errors = { name: 'Required' }
    result.current.setErrors(errors)
    expect(mockSetErrors).toHaveBeenCalledWith(errors)
  })

  it('setSubmitState delegates to store', () => {
    const { result } = renderHook(() => useFormState())
    result.current.setSubmitState('submitting')
    expect(mockSetSubmitState).toHaveBeenCalledWith('submitting')
  })

  it('reset delegates to store', () => {
    const { result } = renderHook(() => useFormState())
    result.current.reset()
    expect(mockReset).toHaveBeenCalled()
  })
})
