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
      // Nghỉ - Tính dựa theo timesheetType và khoảng làm việc
      let breakMinutes = 0

      if (timesheet.startHour && timesheet.endHour) {
        const [startH, startM] = timesheet.startHour.split(':').map(Number)
        const [endH, endM] = timesheet.endHour.split(':').map(Number)

        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        const lunchStart = 12 * 60 // 12:00
        const lunchEnd = record.timesheetType === 30 ? 13 * 60 : 13 * 60 + 30

        // Chỉ tính nghỉ trưa nếu làm QUA giờ trưa
        const isWorkingThroughLunch = startMinutes < lunchEnd && endMinutes > lunchStart

        if (isWorkingThroughLunch) {
          breakMinutes = record.timesheetType === 30 ? 60 : 90
        }
      }

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
