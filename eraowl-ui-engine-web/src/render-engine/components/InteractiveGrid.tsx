interface InteractiveGridProps {
  id?: string
  type?: "interactiveGrid" | "InteractiveGrid"
  columns?: Array<{ label: string; field: string; editable?: boolean }>
  rows?: Array<Record<string, unknown>>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function InteractiveGrid({ id, columns = [], rows = [] }: InteractiveGridProps) {
  return (
    <div id={id} data-eut-component="interactiveGrid" className="eut-grid">
      <table className="eut-grid__table">
        <thead><tr>{columns.map((col, i) => <th key={i}>{col.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{columns.map((col, ci) => <td key={ci} contentEditable={col.editable}>{String(row[col.field] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
