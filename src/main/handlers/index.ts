import { registerAttendanceHandlers } from './attendanceHandlers'
import { registerUserHandlers } from './userHandlers'

export function registerHandlers() {
  registerAttendanceHandlers()
  registerUserHandlers()
}
