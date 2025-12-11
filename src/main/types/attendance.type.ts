import { UserDto } from './user.type'

export type AttendanceRecord = {
  user: UserDto
  timesheets: {
    id: number
    userId: number
    dateTime: Date
    startHour: string | null
    endHour: string | null
    duration: number | null
    isDeleted: boolean
    tickets: {
      id: number
      userId: number
      status: number | null
      type: number | null
      dateTime: Date
      startHour: string | null
      endHour: string | null
      duration: number | null
    }[]
  }[]
}

export interface GetAttendanceParams {
  userIds: number[]
  startDate: Date
  endDate: Date
}

export interface ExportAttendanceParams {
  startDate: Date
  endDate: Date
  users: {
    id: number
    projectId: number
    projectName: string
  }[]
}
