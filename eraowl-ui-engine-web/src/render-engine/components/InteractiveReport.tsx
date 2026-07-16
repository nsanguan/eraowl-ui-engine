interface InteractiveReportProps {
  id?: string
  type?: "interactiveReport" | "InteractiveReport"
  columns?: Array<{ label: string; field: string }>
  rows?: Array<Record<string, unknown>>
  searchable?: boolean
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function InteractiveReport({ id, columns = [], rows = [], searchable }: InteractiveReportProps) {
  return (
    <div id={id} data-eut-component="interactiveReport" className="eut-report eut-report--interactive">
      {searchable && <div className="eut-report__search"><input type="search" placeholder="Search..." className="eut-input" /></div>}
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
