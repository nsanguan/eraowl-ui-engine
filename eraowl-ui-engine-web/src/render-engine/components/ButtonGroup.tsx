interface ButtonGroupProps {
  id?: string
  type?: "buttonGroup" | "ButtonGroup"
  buttons?: Array<{ label: string; variant?: string }>
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function ButtonGroup({ id, buttons = [] }: ButtonGroupProps) {
  return (
    <div id={id} data-eut-component="buttonGroup" className="eut-button-group" role="group">
      {buttons.map((btn, i) => (
        <button key={i} className={`eut-btn eut-btn--${btn.variant ?? 'primary'}`}>{btn.label}</button>
      ))}
    </div>
  )
}
