import { create } from "zustand";

interface RenderState {
  formValues: Record<string, unknown>;
  touched: Record<string, boolean>;
  errors: Record<string, string>;

  setFieldValue: (name: string, value: unknown) => void;
  setFieldTouched: (name: string, isTouched: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  reset: () => void;
  broadcast: () => void;
}

export const useRenderStore = create<RenderState>((set, get) => ({
  formValues: {},
  touched: {},
  errors: {},

  setFieldValue: (name, value) => {
    set((state) => ({
      formValues: { ...state.formValues, [name]: value },
      touched: { ...state.touched, [name]: true },
    }));
    get().broadcast();
  },

  setFieldTouched: (name, isTouched) =>
    set((state) => ({
      touched: { ...state.touched, [name]: isTouched },
    })),

  setErrors: (errors) => set({ errors }),

  reset: () => set({ formValues: {}, touched: {}, errors: {} }),

  broadcast: () => {
    const { formValues, touched, errors } = get();
    window.dispatchEvent(
      new CustomEvent("eods:form-state-change", {
        detail: { formValues, touched, errors },
      })
    );
  },
}));
