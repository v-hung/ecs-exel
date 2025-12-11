import { isWeekend } from 'date-fns'
import { format } from '@renderer/utils/date.utils'
import { AttendanceTableRow } from '../../hooks/dataTransform'

interface TimeRowProps {
  record: AttendanceTableRow
  label: string
  timeIndex: number
  dateRange: Date[]
  totalRows: number
  userIndex: number
  projectName?: string
}

const DEFAULT_BREAK_MINUTES = 90 // 1h30 mặc định

export function TimeRow({
  record,
  label,
  timeIndex,
  dateRange,
  totalRows,
  userIndex,
  projectName
}: TimeRowProps) {
  const renderTimeValue = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const timesheet = record.timesheets.find((ts) => {
      const tsDate = new Date(ts.dateTime)
      return format(tsDate, 'yyyy-MM-dd') === dateKey
    })

    if (!timesheet) return '-'

    let value = '-'
    let hasTicket = false

    if (timeIndex === 0) {
      // Giờ vào - bỏ giây
      const startHour = timesheet.startHour || '-'
      value = startHour !== '-' ? startHour.substring(0, 5) : '-'
      hasTicket = timesheet.tickets?.length > 0
    } else if (timeIndex === 1) {
      // Giờ ra - bỏ giây
      const endHour = timesheet.endHour || '-'
      value = endHour !== '-' ? endHour.substring(0, 5) : '-'
    } else if (timeIndex === 2) {
      // Nghỉ - Mặc định 1h30 (90 phút) trừ đi timesheetType
      const breakMinutes = DEFAULT_BREAK_MINUTES - (record.timesheetType || 0)

      if (breakMinutes > 0) {
        value = `${Math.floor(breakMinutes / 60)}:${String(breakMinutes % 60).padStart(2, '0')}`
      } else {
        value = '0:00'
      }
    } else if (timeIndex === 3) {
      // Tổng
      const hours = Math.floor((timesheet.duration || 0) / 60)
      const minutes = (timesheet.duration || 0) % 60
      value = `${hours}:${String(minutes).padStart(2, '0')}`
    }

    return (
      <div className="time-cell">
        {value}
        {hasTicket && timeIndex === 0 && (
          <span className="ticket-indicator" title="Có ticket">
            T
          </span>
        )}
      </div>
    )
  }

  return (
    <tr className={`time-row ${timeIndex === 3 ? 'total-time-row' : ''}`}>
      {timeIndex === 0 && (
        <>
          <td className="col-no" rowSpan={totalRows}>
            {userIndex + 1}
          </td>
          <td className="col-name" rowSpan={totalRows}>
            <div className="user-info">
              <div className="user-name">{record.name}</div>
              {record.username && <div className="user-username">@{record.username}</div>}
              {projectName && <div className="user-username">{projectName}</div>}
            </div>
          </td>
        </>
      )}
      <td className="col-type-project" colSpan={2}>
        {label}
      </td>
      {dateRange.map((date) => {
        const isWeekendDay = isWeekend(date)
        return (
          <td key={date.toISOString()} className={`col-date ${isWeekendDay ? 'weekend' : ''}`}>
            {renderTimeValue(date)}
          </td>
        )
      })}
      <td className="col-total">{timeIndex === 3 ? <strong>{record.totalHours}</strong> : '-'}</td>
    </tr>
  )
}
