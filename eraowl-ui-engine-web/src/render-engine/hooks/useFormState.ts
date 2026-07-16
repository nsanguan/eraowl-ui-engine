import { useRenderStore } from "../../store/useRenderStore";

export function useFormState() {
  const formValues = useRenderStore((s) => s.formValues);
  const touched = useRenderStore((s) => s.touched);
  const errors = useRenderStore((s) => s.errors);

  const setFieldValue = (name: string, value: unknown) => {
    useRenderStore.getState().setFieldValue(name, value);
  };

  const setFieldTouched = (name: string, isTouched = true) => {
    useRenderStore.getState().setFieldTouched(name, isTouched);
  };

  const setErrors = (errors: Record<string, string>) => {
    useRenderStore.getState().setErrors(errors);
  };

  const reset = () => {
    useRenderStore.getState().reset();
  };

  return {
    formValues,
    touched,
    errors,
    setFieldValue,
    setFieldTouched,
    setErrors,
    reset,
  };
}
