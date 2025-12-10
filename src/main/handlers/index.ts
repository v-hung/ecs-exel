import { registerAttendanceHandlers } from './attendanceHandlers'
import { registerUserHandlers } from './userHandlers'
import { registerTimesheetHandlers } from './timesheetHandlers'
import { registerTicketHandlers } from './ticketHandlers'

export function registerHandlers() {
  registerAttendanceHandlers()
  registerUserHandlers()
  registerTimesheetHandlers()
  registerTicketHandlers()
}
