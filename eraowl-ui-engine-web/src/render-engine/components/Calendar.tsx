interface CalendarProps {
  id?: string
  type?: "calendar" | "Calendar"
  templateOptions?: Record<string, string | boolean | number>
  [key: string]: unknown
}

export function Calendar({ id }: CalendarProps) {
  return (
    <div id={id} data-eut-component="calendar" className="eut-calendar">
      <div className="eut-calendar__placeholder">Calendar component — requires FullCalendar integration</div>
    </div>
  )
}
