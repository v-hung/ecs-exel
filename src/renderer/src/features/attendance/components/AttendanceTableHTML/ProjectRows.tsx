import { isWeekend } from 'date-fns'
import { format } from '@renderer/utils/date.utils'
import type { Project } from '@renderer/stores/projectStore'
import { AttendanceTableRow } from '../../hooks/dataTransform'

interface ProjectRowsProps {
  record: AttendanceTableRow
  projects: Project[]
  dateRange: Date[]
}

export function ProjectRows({ record, projects, dateRange }: ProjectRowsProps) {
  const renderProjectValue = (projectId: number, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const timesheet = record.timesheets.find((ts) => {
      const tsDate = new Date(ts.dateTime)
      return format(tsDate, 'yyyy-MM-dd') === dateKey
    })

    if (!timesheet) return '0:00'

    // Nếu không phải dự án của user
    if (record.userProjectId !== projectId) return '0:00'

    // Lấy tổng thời gian từ duration (tất cả labels)
    const hours = Math.floor((timesheet.duration || 0) / 60)
    const minutes = (timesheet.duration || 0) % 60
    return `${hours}:${String(minutes).padStart(2, '0')}`
  }

  const calculateProjectTotal = (projectId: number) => {
    // Nếu không phải dự án của user
    if (record.userProjectId !== projectId) return '0:00'

    // Tổng thời gian của tất cả các ngày
    const totalMinutes = record.timesheets.reduce((sum, ts) => sum + (ts.duration || 0), 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${String(minutes).padStart(2, '0')}`
  }

  const renderTotalRow = () => {
    return (
      <tr className="project-total-row">
        <td className="col-type-project" colSpan={2} style={{ fontWeight: 600 }}>
          Tổng dự án
        </td>
        {dateRange.map((date) => {
          const isWeekendDay = isWeekend(date)
          const dateKey = format(date, 'yyyy-MM-dd')
          const timesheet = record.timesheets.find((ts) => {
            const tsDate = new Date(ts.dateTime)
            return format(tsDate, 'yyyy-MM-dd') === dateKey
          })

          const totalMinutes = timesheet?.duration || 0
          const hours = Math.floor(totalMinutes / 60)
          const minutes = totalMinutes % 60
          const value = `${hours}:${String(minutes).padStart(2, '0')}`

          return (
            <td
              key={date.toISOString()}
              className={`col-date ${isWeekendDay ? 'weekend' : ''}`}
              style={{ fontWeight: 600 }}
            >
              {value}
            </td>
          )
        })}
        <td className="col-total" style={{ fontWeight: 600 }}>
          <strong>{record.totalHours}</strong>
        </td>
      </tr>
    )
  }

  return (
    <>
      {projects.map((project, projectIndex) => {
        const isAssigned = record.userProjectId === project.id
        return (
          <tr key={`${record.key}-project-${project.id}`} className="project-row">
            {projectIndex === 0 && (
              <td className="col-type" rowSpan={projects.length}>
                Thời gian làm việc
              </td>
            )}
            <td className="col-project" style={{ color: isAssigned ? '#ff4d4f' : 'inherit' }}>
              Dự án #{project.id}
            </td>
            {dateRange.map((date) => {
              const isWeekendDay = isWeekend(date)
              return (
                <td
                  key={date.toISOString()}
                  className={`col-date ${isWeekendDay ? 'weekend' : ''}`}
                  style={{ color: isAssigned ? '#ff4d4f' : 'inherit' }}
                >
                  {renderProjectValue(project.id, date)}
                </td>
              )
            })}
            <td className="col-total">
              <strong>{calculateProjectTotal(project.id)}</strong>
            </td>
          </tr>
        )
      })}
      {renderTotalRow()}
    </>
  )
}
