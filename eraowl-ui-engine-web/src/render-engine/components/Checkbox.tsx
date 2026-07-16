import { useFormState } from "../hooks/useFormState";

interface CheckboxProps {
  id?: string;
  type?: "checkbox" | "Checkbox";
  label?: string;
  name?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Checkbox({ id, label, name, templateOptions }: CheckboxProps) {
  const fieldName = name ?? id ?? "checkbox";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;
  const checked = Boolean(formValues[fieldName] ?? false);

  return (
    <div id={id} data-eut-component="checkbox" className="eods-checkbox-wrapper">
      <label className="eods-checkbox__label">
        <input
          type="checkbox"
          className="eods-checkbox"
          id={id}
          name={fieldName}
          checked={isBound ? checked : undefined}
          defaultChecked={isBound ? undefined : false}
          onChange={isBound ? (e) => setFieldValue(fieldName, e.target.checked) : undefined}
        />
        {label && <span className="eods-checkbox__text">{label}</span>}
      </label>
    </div>
  );
}
