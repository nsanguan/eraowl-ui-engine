import { useFormState } from "../hooks/useFormState";

interface TextareaProps {
  id?: string;
  type?: "textarea" | "Textarea";
  label?: string;
  name?: string;
  placeholder?: string;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Textarea({ id, label, name, placeholder, templateOptions }: TextareaProps) {
  const fieldName = name ?? id ?? "textarea";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;
  const rows = (templateOptions?.rows as number) ?? 4;
  const value = String(formValues[fieldName] ?? "");

  return (
    <div id={id} data-eut-component="textarea" className="eods-textarea-wrapper">
      {label && (
        <label className="eods-textarea__label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        className="eods-textarea"
        id={id}
        name={fieldName}
        placeholder={placeholder ?? ""}
        rows={rows}
        value={isBound ? value : undefined}
        defaultValue={isBound ? undefined : placeholder}
        onChange={isBound ? (e) => setFieldValue(fieldName, e.target.value) : undefined}
      />
    </div>
  );
}
