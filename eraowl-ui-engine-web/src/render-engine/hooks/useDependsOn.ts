import { useRenderStore } from "../../store/useRenderStore";

export function useDependsOn(fieldNames: string[]) {
  const formValues = useRenderStore((s) => s.formValues);
  const touched = useRenderStore((s) => s.touched);

  const dependencyValues = fieldNames.reduce(
    (acc, name) => {
      acc[name] = formValues[name];
      return acc;
    },
    {} as Record<string, unknown>
  );

  const hasChanged = fieldNames.some(
    (name) => touched[name] && formValues[name] !== undefined
  );

  return {
    dependencyValues,
    hasChanged,
    allDefined: fieldNames.every(
      (name) => formValues[name] !== undefined && formValues[name] !== ""
    ),
  };
}
