import { useRenderStore } from "../../store/useRenderStore";

/**
 * Hook for form state management in the render engine.
 *
 * Returns reactive state selectors and stable action references
 * directly from the Zustand store (no new closures per render).
 */
export function useFormState() {
  const formValues = useRenderStore((s) => s.formValues);
  const touched = useRenderStore((s) => s.touched);
  const errors = useRenderStore((s) => s.errors);
  const submitState = useRenderStore((s) => s.submitState);

  // Return stable action references directly from the store —
  // Zustand guarantees these are referentially stable across renders.
  const { setFieldValue, setFieldTouched, setErrors, setSubmitState, reset } =
    useRenderStore.getState();

  return {
    formValues,
    touched,
    errors,
    submitState,
    setFieldValue,
    setFieldTouched,
    setErrors,
    setSubmitState,
    reset,
  };
}
