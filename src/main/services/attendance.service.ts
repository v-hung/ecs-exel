import { and, between, eq, inArray } from 'drizzle-orm'
import { timesheets, type Timesheet } from '../database/schema/timesheets'
import { tickets, type Ticket, TicketStatus } from '../database/schema/tickets'
import db from '../database'
import { getUserByIds } from './user.service'
import { AttendanceRecord, GetAttendanceParams } from '../types/attendance.type'

export const attendanceService = {
  /**
   * Lấy dữ liệu chấm công và tickets xin nghỉ theo khoảng thời gian
   */
  async getAttendanceData(params: GetAttendanceParams): Promise<AttendanceRecord[]> {
    const { userIds, startDate, endDate } = params

    const userList = await getUserByIds(userIds)

    // Lấy timesheets trong khoảng thời gian
    const timesheetList = await db
      .select()
      .from(timesheets)
      .where(
        and(
          inArray(
            timesheets.userId,
            userList.map((u) => u.id)
          ),
          between(timesheets.dateTime, startDate, endDate),
          eq(timesheets.isDeleted, false)
        )
      )
      .orderBy(timesheets.dateTime)

    // Lấy tickets đã được approve trong khoảng thời gian
    const ticketList = await db
      .select()
      .from(tickets)
      .where(
        and(
          inArray(
            tickets.userId,
            userList.map((u) => u.id)
          ),
          between(tickets.dateTime, startDate, endDate),
          eq(tickets.status, TicketStatus.ACCEPT),
          eq(tickets.isDeleted, false)
        )
      )
      .orderBy(tickets.dateTime)

    // Tạo Map để tối ưu performance
    const timesheetsByUserId = new Map<number, Timesheet[]>()
    const ticketsByDateTime = new Map<string, Ticket[]>()

    // Group timesheets theo userId
    timesheetList.forEach((timesheet) => {
      const userId = timesheet.userId
      if (!timesheetsByUserId.has(userId)) {
        timesheetsByUserId.set(userId, [])
      }
      timesheetsByUserId.get(userId)!.push(timesheet)
    })

    // Group tickets theo userId và dateTime
    ticketList.forEach((ticket) => {
      const key = `${ticket.userId}_${ticket.dateTime}`
      if (!ticketsByDateTime.has(key)) {
        ticketsByDateTime.set(key, [])
      }
      ticketsByDateTime.get(key)!.push(ticket)
    })

    // Map data theo structure AttendanceRecord
    const result: AttendanceRecord[] = userList.map((user) => {
      const userTimesheets = timesheetsByUserId.get(user.id) || []

      const timesheetsWithTickets = userTimesheets.map((timesheet) => {
        const key = `${timesheet.userId}_${timesheet.dateTime}`
        const relatedTickets = ticketsByDateTime.get(key) || []

        return {
          ...timesheet,
          tickets: relatedTickets
        }
      })

      return {
        user,
        timesheets: timesheetsWithTickets
      }
    })

    return result
  },

  /**
   * Lấy timesheets của một user trong khoảng thời gian
   */
  async getTimesheetsByUser(userId: number, startDate: Date, endDate: Date): Promise<Timesheet[]> {
    return await db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.userId, userId),
          between(timesheets.dateTime, startDate, endDate),
          eq(timesheets.isDeleted, false)
        )
      )
      .orderBy(timesheets.dateTime)
  },

  /**
   * Lấy tickets của một user trong khoảng thời gian
   */
  async getTicketsByUser(userId: number, startDate: Date, endDate: Date): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.userId, userId),
          between(tickets.dateTime, startDate, endDate),
          eq(tickets.status, TicketStatus.ACCEPT),
          eq(tickets.isDeleted, false)
        )
      )
      .orderBy(tickets.dateTime)
  }
}
