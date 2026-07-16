interface TableProps {
  id?: string;
  type?: "table" | "Table";
  label?: string;
  columns?: { key: string; title: string }[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function Table({ id, label, columns, templateOptions }: TableProps) {
  const striped = templateOptions?.striped ?? false;
  const cols = columns ?? [];

  return (
    <div id={id} data-eut-component="table" className="eods-table-wrapper">
      {label && <div className="eods-table__label">{label}</div>}
      <table className={`eods-table ${striped ? "eods-table--striped" : ""}`}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className="eods-table__th">
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="eods-table__empty" colSpan={Math.max(cols.length, 1)}>
              No data
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
