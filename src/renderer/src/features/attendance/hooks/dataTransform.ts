import type { Project } from '@renderer/stores/projectStore'
import { AttendanceRecord } from 'src/main/types/attendance.type'

export interface AttendanceTableRow {
  key: string
  userId: number
  name: string
  username: string
  timesheetType: number
  userProjectId: number | null // Chỉ 1 project
  timesheets: AttendanceRecord['timesheets']
  totalHours: string
}

export function transformAttendanceData(
  data: AttendanceRecord[] | undefined,
  projects: Project[]
): { rows: AttendanceTableRow[]; projects: Project[] } {
  if (!data) return { rows: [], projects }

  const rows: AttendanceTableRow[] = data.map((record) => {
    const user = record.user

    // Find which project this user belongs to (only 1 project)
    const userProject = projects.find((p) => p.employeeIds.includes(user.id))

    // Calculate total hours
    const totalMinutes = record.timesheets.reduce((sum, ts) => sum + (ts.duration || 0), 0)
    const totalHours = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`

    return {
      key: `user-${user.id}`,
      userId: user.id,
      name: user.name,
      username: user.username || '',
      timesheetType: user.timesheetType || 0,
      userProjectId: userProject?.id || null,
      timesheets: record.timesheets,
      totalHours
    }
  })

  return { rows, projects }
}
