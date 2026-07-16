import { useFormState } from "../hooks/useFormState";

interface DatePickerProps {
  id?: string;
  type?: "datePicker" | "DatePicker";
  label?: string;
  name?: string;
  placeholder?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function DatePicker({ id, label, name, placeholder, templateOptions }: DatePickerProps) {
  const fieldName = name ?? id ?? "datepicker";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;
  const value = String(formValues[fieldName] ?? "");

  return (
    <div id={id} data-eut-component="datePicker" className="eods-datepicker-wrapper">
      {label && (
        <label className="eods-datepicker__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        type="date"
        className="eods-datepicker"
        id={id}
        name={fieldName}
        placeholder={placeholder ?? ""}
        value={isBound ? value : undefined}
        defaultValue={isBound ? undefined : ""}
        onChange={isBound ? (e) => setFieldValue(fieldName, e.target.value) : undefined}
      />
    </div>
  );
}
