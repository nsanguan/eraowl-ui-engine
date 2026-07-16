import { create } from 'zustand'

export type SubmitState = 'idle' | 'validating' | 'ready' | 'submitting' | 'error'

interface RenderState {
  formValues: Record<string, unknown>
  touched: Record<string, boolean>
  errors: Record<string, string>
  submitState: SubmitState

  setFieldValue: (name: string, value: unknown) => void
  setFieldTouched: (name: string, isTouched: boolean) => void
  setErrors: (errors: Record<string, string>) => void
  setSubmitState: (state: SubmitState) => void
  reset: () => void
  broadcast: () => void
}

export const useRenderStore = create<RenderState>((set, get) => ({
  formValues: {},
  touched: {},
  errors: {},
  submitState: 'idle',

  setFieldValue: (name, value) => {
    set((state) => ({
      formValues: { ...state.formValues, [name]: value },
      touched: { ...state.touched, [name]: true },
    }))
    get().broadcast()
  },

  setFieldTouched: (name, isTouched) =>
    set((state) => ({
      touched: { ...state.touched, [name]: isTouched },
    })),

  setErrors: (errors) => set({ errors }),

  setSubmitState: (submitState) => set({ submitState }),

  reset: () => set({ formValues: {}, touched: {}, errors: {}, submitState: 'idle' }),

  broadcast: () => {
    const { formValues, touched, errors } = get()
    window.dispatchEvent(
      new CustomEvent('eods:form-state-change', {
        detail: { formValues, touched, errors },
      })
    )
  },
}))
