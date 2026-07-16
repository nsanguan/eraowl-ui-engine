import { useFormState } from "../hooks/useFormState";

interface RadioGroupProps {
  id?: string;
  type?: "radioGroup" | "RadioGroup";
  label?: string;
  name?: string;
  options?: { label: string; value: string }[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function RadioGroup({ id, label, name, options, templateOptions }: RadioGroupProps) {
  const fieldName = name ?? id ?? "radiogroup";
  const { formValues, setFieldValue } = useFormState();
  const isBound = templateOptions?.bindToForm ?? true;
  const currentValue = String(formValues[fieldName] ?? "");
  const opts = options ?? [];

  return (
    <div id={id} data-eut-component="radioGroup" className="eods-radiogroup-wrapper">
      {label && (
        <legend className="eods-radiogroup__label">{label}</legend>
      )}
      <div className="eods-radiogroup__options">
        {opts.map((opt) => (
          <label key={opt.value} className="eods-radiogroup__option">
            <input
              type="radio"
              className="eods-radiogroup__input"
              name={fieldName}
              value={opt.value}
              checked={isBound ? currentValue === opt.value : undefined}
              defaultChecked={isBound ? undefined : false}
              onChange={isBound ? () => setFieldValue(fieldName, opt.value) : undefined}
            />
            <span className="eods-radiogroup__text">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
