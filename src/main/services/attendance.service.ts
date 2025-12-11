import { and, between, eq, inArray } from 'drizzle-orm'
import { timesheets, type Timesheet } from '../database/schema/timesheets'
import { tickets, type Ticket, TicketStatus } from '../database/schema/tickets'
import db from '../database'
import { getUserByIds } from './user.service'
import { AttendanceRecord, GetAttendanceParams } from '../types/attendance.type'
import { calculateWorkDuration } from '../utils/timesheet.utils'

export const attendanceService = {
  /**
   * Lấy dữ liệu chấm công và tickets xin nghỉ theo khoảng thời gian
   */
  async getAttendanceData(params: GetAttendanceParams): Promise<AttendanceRecord[]> {
    const { userIds, startDate, endDate } = params

    const userList = await getUserByIds(userIds)

    // Chuẩn hóa startDate về đầu ngày (00:00:00) và endDate về cuối ngày (23:59:59)
    const normalizedStartDate = new Date(startDate)
    normalizedStartDate.setHours(0, 0, 0, 0)

    const normalizedEndDate = new Date(endDate)
    normalizedEndDate.setHours(23, 59, 59, 999)

    // Lấy timesheets trong khoảng thời gian
    const timesheetList = await db
      .select({
        id: timesheets.id,
        userId: timesheets.userId,
        dateTime: timesheets.dateTime,
        startHour: timesheets.startHour,
        endHour: timesheets.endHour,
        duration: timesheets.duration,
        isDeleted: timesheets.isDeleted
      })
      .from(timesheets)
      .where(
        and(
          inArray(
            timesheets.userId,
            userList.map((u) => u.id)
          ),
          between(timesheets.dateTime, normalizedStartDate, normalizedEndDate),
          eq(timesheets.isDeleted, false)
        )
      )
      .orderBy(timesheets.dateTime)

    // Lấy tickets đã được approve trong khoảng thời gian
    const ticketList = await db
      .select({
        id: tickets.id,
        userId: tickets.userId,
        status: tickets.status,
        type: tickets.type,
        dateTime: tickets.dateTime,
        startHour: tickets.startHour,
        endHour: tickets.endHour,
        duration: tickets.duration,
        isDeleted: tickets.isDeleted
      })
      .from(tickets)
      .where(
        and(
          inArray(
            tickets.userId,
            userList.map((u) => u.id)
          ),
          between(tickets.dateTime, normalizedStartDate, normalizedEndDate),
          eq(tickets.status, TicketStatus.ACCEPT),
          eq(tickets.isDeleted, false),
          eq(tickets.type, 0), // Chỉ lấy ticket nghỉ phép
          eq(tickets.status, 1) // Chỉ lấy ticket đã được approve
        )
      )
      .orderBy(tickets.dateTime)

    // Tạo Map để tối ưu performance
    const timesheetsByUserId = new Map<
      number,
      Omit<AttendanceRecord['timesheets'][number], 'tickets'>[]
    >()
    const ticketsByDateTime = new Map<
      string,
      AttendanceRecord['timesheets'][number]['tickets'][number][]
    >()

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

        // // Tính lại duration chính xác cho từng ticket
        // const ticketsWithCalculatedDuration = relatedTickets.map((ticket) => ({
        //   ...ticket,
        //   duration: calculateWorkDuration(ticket.startHour, ticket.endHour, 0, [])
        // }))

        // Tính lại duration cho timesheet - truyền tickets với startHour/endHour
        const calculatedDuration = calculateWorkDuration(
          timesheet.startHour,
          timesheet.endHour,
          user.timesheetType || 0
        )

        return {
          ...timesheet,
          duration: calculatedDuration,
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
