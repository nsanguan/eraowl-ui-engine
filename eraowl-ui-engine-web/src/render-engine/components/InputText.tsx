import { useFormState } from "../hooks/useFormState";

interface InputTextProps {
  id?: string;
  type?: "inputText" | "InputText";
  label?: string;
  name?: string;
  placeholder?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function InputText({ id, label, name, placeholder, templateOptions }: InputTextProps) {
  const fieldName = name ?? id ?? "input";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;

  const value = String(formValues[fieldName] ?? "");

  return (
    <div id={id} data-eut-component="inputText" className="eods-input-text-wrapper">
      {label && (
        <label className="eods-input-text__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        className="eods-input-text"
        id={id}
        name={fieldName}
        placeholder={placeholder ?? ""}
        value={isBound ? value : undefined}
        defaultValue={isBound ? undefined : placeholder}
        onChange={isBound ? (e) => setFieldValue(fieldName, e.target.value) : undefined}
      />
    </div>
  );
}
