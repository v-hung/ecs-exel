import { Ticket } from '../database/schema/tickets'
import { Timesheet } from '../database/schema/timesheets'
import { UserDto } from './user.type'

export type AttendanceRecord = {
  user: UserDto
  timesheets: (Timesheet & {
    tickets: Ticket[]
  })[]
}

export interface GetAttendanceParams {
  userIds: number[]
  startDate: Date
  endDate: Date
}
