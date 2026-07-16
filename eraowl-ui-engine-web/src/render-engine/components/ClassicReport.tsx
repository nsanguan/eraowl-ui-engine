interface ClassicReportProps {
  id?: string
  type?: "classicReport" | "ClassicReport"
  columns?: Array<{ label: string; field: string }>
  rows?: Array<Record<string, unknown>>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function ClassicReport({ id, columns = [], rows = [] }: ClassicReportProps) {
  if (columns.length === 0) {
    return <div id={id} data-eut-component="classicReport" className="eut-report eut-report--empty">No columns defined</div>
  }
  return (
    <div id={id} data-eut-component="classicReport" className="eut-report">
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
