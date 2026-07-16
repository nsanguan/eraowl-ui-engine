interface ReflowReportProps {
  id?: string
  type?: "reflowReport" | "ReflowReport"
  columns?: Array<{ label: string; field: string }>
  rows?: Array<Record<string, unknown>>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function ReflowReport({ id, columns = [], rows = [] }: ReflowReportProps) {
  return (
    <div id={id} data-eut-component="reflowReport" className="eut-report eut-report--reflow">
      {rows.map((row, ri) => (
        <div key={ri} className="eut-report__card">
          {columns.map((col, ci) => (
            <div key={ci} className="eut-report__field">
              <span className="eut-report__label">{col.label}:</span>
              <span className="eut-report__value">{String(row[col.field] ?? '')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
