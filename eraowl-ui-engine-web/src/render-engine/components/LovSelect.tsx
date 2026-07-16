import { useCascadeQuery } from "../hooks/useCascadeQuery";
import { useFormState } from "../hooks/useFormState";

interface LovSelectProps {
  id?: string;
  type?: "lov_select" | "LovSelect";
  label?: string;
  name?: string;
  lovSource?: string;
  dependsOn?: string[];
  templateOptions?: Record<string, string | boolean>;
  [key: string]: unknown;
}

export function LovSelect({
  id,
  label,
  name,
  lovSource,
  dependsOn,
  templateOptions,
}: LovSelectProps) {
  const { data, isLoading } = useCascadeQuery(lovSource ?? "", dependsOn ?? []);
  const { formValues, setFieldValue } = useFormState();
  const fieldName = name ?? id ?? "lovselect";
  const currentValue = String(formValues[fieldName] ?? "");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFieldValue(fieldName, e.target.value);
  };

  const size = templateOptions?.size ?? "medium";

  return (
    <div
      className={`eods-lov-select eods-lov-select--${size}`}
      id={id}
      data-eut-component="lov_select"
    >
      {label && (
        <label className="eods-lov-select__label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        className="eods-lov-select__input"
        id={id}
        name={name ?? id}
        value={currentValue}
        onChange={handleChange}
        disabled={isLoading}
      >
        <option value="">Select...</option>
        {data?.items?.map((item: { label: string; value: string }) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
