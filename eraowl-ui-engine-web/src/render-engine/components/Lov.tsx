import { useCascadeQuery } from "../hooks/useCascadeQuery";

interface LovProps {
  id?: string;
  type?: "lov" | "Lov";
  label?: string;
  lovSource?: string;
  dependsOn?: string[];
  templateOptions?: Record<string, string | boolean>;
  [key: string]: unknown;
}

export function Lov({ id, label, lovSource, dependsOn, templateOptions }: LovProps) {
  const { data, isLoading } = useCascadeQuery(lovSource ?? "", dependsOn ?? []);

  const displayMode = templateOptions?.displayMode ?? "list";

  return (
    <div
      className={`eods-lov eods-lov--${displayMode}`}
      id={id}
      data-eut-component="lov"
    >
      {label && <label className="eods-lov__label">{label}</label>}
      {isLoading ? (
        <div className="eods-lov__loading">Loading...</div>
      ) : (
        <ul className="eods-lov__list">
          {data?.items?.map((item: { label: string; value: string }) => (
            <li key={item.value} className="eods-lov__item">
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
