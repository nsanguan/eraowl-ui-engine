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

  // Use hooks to subscribe to store actions — this guarantees the refs stay
  // current even if Zustand internals ever replace the action functions,
  // and avoids the stale-closure footgun of calling getState() once at mount.
  const setFieldValue = useRenderStore((s) => s.setFieldValue);
  const setFieldTouched = useRenderStore((s) => s.setFieldTouched);
  const setErrors = useRenderStore((s) => s.setErrors);
  const setSubmitState = useRenderStore((s) => s.setSubmitState);
  const reset = useRenderStore((s) => s.reset);

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
