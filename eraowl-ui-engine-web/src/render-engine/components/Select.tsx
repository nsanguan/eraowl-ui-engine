import { useFormState } from "../hooks/useFormState";

interface SelectProps {
  id?: string;
  type?: "select" | "Select";
  label?: string;
  name?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Select({ id, label, name, placeholder, options, templateOptions }: SelectProps) {
  const fieldName = name ?? id ?? "select";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;
  const currentValue = String(formValues[fieldName] ?? "");
  const opts = options ?? [];

  return (
    <div id={id} data-eut-component="select" className="eods-select-wrapper">
      {label && (
        <label className="eods-select__label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        className="eods-select"
        id={id}
        name={fieldName}
        value={isBound ? currentValue : undefined}
        defaultValue={isBound ? undefined : ""}
        onChange={isBound ? (e) => setFieldValue(fieldName, e.target.value) : undefined}
      >
        <option value="">{placeholder ?? "Select..."}</option>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
