import React from 'react'
import { isWeekend } from 'date-fns'
import { format } from '@renderer/utils/date.utils'
import type { Project } from '@renderer/stores/projectStore'
import './table.css'
import { AttendanceTableRow } from '../../hooks/dataTransform'
import { TimeRow } from './TimeRow'
import { ProjectRows } from './ProjectRows'

interface AttendanceTableHTMLProps {
  rows: AttendanceTableRow[]
  projects: Project[]
  dateRange: Date[]
  loading?: boolean
}

export function AttendanceTableHTML({
  rows,
  projects,
  dateRange,
  loading
}: AttendanceTableHTMLProps) {
  const TIME_LABELS = ['Giờ vào', 'Giờ ra', 'Nghỉ', 'Tổng ngày']
  const TIME_ROWS = 4

  const businessDaysCount = dateRange.filter((date) => !isWeekend(date)).length

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="attendance-table-wrapper">
      <table className="attendance-table">
        <thead>
          <tr>
            <th className="col-no" rowSpan={2}>
              STT
            </th>
            <th className="col-name" rowSpan={2}>
              Họ và tên
            </th>
            <th className="col-type-project" rowSpan={2} colSpan={2}>
              Loại / Dự án
            </th>
            <th className="col-date-group" colSpan={dateRange.length}>
              Bảng chấm công ({businessDaysCount} ngày làm việc)
            </th>
            <th className="col-total">Tổng</th>
          </tr>
          <tr>
            {dateRange.map((date) => {
              const isWeekendDay = isWeekend(date)
              return (
                <th
                  key={date.toISOString()}
                  className={`col-date ${isWeekendDay ? 'weekend' : ''}`}
                >
                  <div className="date-header">
                    <div className="date-day">{format(date, 'EEE')}</div>
                    <div className="date-number">{format(date, 'dd/MM')}</div>
                  </div>
                </th>
              )
            })}
            <th className="col-total">-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((record, userIndex) => {
            const totalRows = TIME_ROWS + projects.length + 1
            const projectName = projects.find((p) => p.id === record.userProjectId)?.name

            return (
              <React.Fragment key={record.key}>
                {/* 4 time rows */}
                {TIME_LABELS.map((label, timeIndex) => (
                  <TimeRow
                    key={`${record.key}-time-${timeIndex}`}
                    record={record}
                    label={label}
                    timeIndex={timeIndex}
                    dateRange={dateRange}
                    totalRows={totalRows}
                    userIndex={userIndex}
                    projectName={projectName}
                  />
                ))}

                {/* Project rows + Total row */}
                <ProjectRows record={record} projects={projects} dateRange={dateRange} />
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
