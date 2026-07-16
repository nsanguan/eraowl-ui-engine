interface ColumnToggleReportProps {
  id?: string
  type?: "columnToggleReport" | "ColumnToggleReport"
  columns?: Array<{ label: string; field: string }>
  rows?: Array<Record<string, unknown>>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function ColumnToggleReport({ id, columns = [], rows = [] }: ColumnToggleReportProps) {
  return (
    <div id={id} data-eut-component="columnToggleReport" className="eut-report eut-report--toggle">
      <div className="eut-report__toggles">
        {columns.map((col, i) => (
          <label key={i} className="eut-checkbox-label"><input type="checkbox" defaultChecked /> {col.label}</label>
        ))}
      </div>
      <table className="eut-report__table">
        <thead><tr>{columns.map((col, i) => <th key={i}>{col.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{columns.map((col, ci) => <td key={ci}>{String(row[col.field] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
