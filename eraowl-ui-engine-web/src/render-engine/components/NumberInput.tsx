import { useFormState } from "../hooks/useFormState";

interface NumberInputProps {
  id?: string;
  type?: "numberInput" | "NumberInput";
  label?: string;
  name?: string;
  placeholder?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function NumberInput({ id, label, name, placeholder, templateOptions }: NumberInputProps) {
  const fieldName = name ?? id ?? "numberinput";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;
  const min = (templateOptions?.min as number) ?? 0;
  const max = (templateOptions?.max as number) ?? 9999;
  const step = (templateOptions?.step as number) ?? 1;
  const value = String(formValues[fieldName] ?? "");

  return (
    <div id={id} data-eut-component="numberInput" className="eods-numberinput-wrapper">
      {label && (
        <label className="eods-numberinput__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        type="number"
        className="eods-numberinput"
        id={id}
        name={fieldName}
        placeholder={placeholder ?? ""}
        min={min}
        max={max}
        step={step}
        value={isBound ? value : undefined}
        defaultValue={isBound ? undefined : ""}
        onChange={isBound ? (e) => setFieldValue(fieldName, Number(e.target.value)) : undefined}
      />
    </div>
  );
}
