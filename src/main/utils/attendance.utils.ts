import { AttendanceRecord } from '../types/attendance.type'

/**
 * Format lại giờ vào, ra cho từng timesheet trong AttendanceRecord[]
 * - Làm tròn giờ vào LÊN mốc 15 phút gần nhất (8:10 → 8:15, 8:34 → 8:45)
 * - Tính giờ ra = giờ vào + duration + thời gian nghỉ trưa (tùy timesheetType)
 * - timesheetType = 30: nghỉ trưa 12:00-13:00 (60 phút), endTime max 18:00
 * - timesheetType = 0: nghỉ trưa 12:00-13:30 (90 phút), endTime max 18:30
 * - Duration max 8h (480 phút), đã được làm tròn sẵn
 */
export function formatAttendanceTimes(records: AttendanceRecord[]): AttendanceRecord[] {
  function getTimeString(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  /**
   * Làm tròn LÊN mốc 15 phút gần nhất
   * 8:10 → 8:15, 8:34 → 8:45, 9:02 → 9:15, 11:00 → 11:00
   */
  function roundUpTo15Minutes(hour: number, minute: number): { hour: number; minute: number } {
    const remainder = minute % 15
    if (remainder === 0) {
      return { hour, minute }
    }
    const roundedMinute = minute + (15 - remainder)
    if (roundedMinute >= 60) {
      return { hour: hour + 1, minute: roundedMinute - 60 }
    }
    return { hour, minute: roundedMinute }
  }

  /**
   * Tính thời gian nghỉ trưa dựa theo timesheetType
   * - timesheetType = 30: 12:00-13:00 (60 phút)
   * - timesheetType = 0: 12:00-13:30 (90 phút)
   * Chỉ tính nếu khoảng thời gian làm việc có chứa khoảng nghỉ trưa
   */
  function calculateLunchBreak(
    startMinutes: number,
    endMinutes: number,
    timesheetType: number
  ): number {
    const lunchStart = 12 * 60 // 12:00 = 720 phút
    let lunchEnd: number
    let lunchDuration: number

    if (timesheetType === 30) {
      lunchEnd = 13 * 60 // 13:00 = 780 phút
      lunchDuration = 60 // phút
    } else {
      lunchEnd = 13 * 60 + 30 // 13:30 = 810 phút
      lunchDuration = 90 // phút
    }

    // Nếu khoảng làm việc không chứa giờ nghỉ trưa thì không tính
    if (endMinutes <= lunchStart || startMinutes >= lunchEnd) {
      return 0
    }

    // Nếu làm qua giờ nghỉ trưa thì cộng thời gian nghỉ
    return lunchDuration
  }

  return records.map((record) => {
    const timesheetType = record.user.timesheetType || 0

    const formattedTimesheets = record.timesheets.map((ts) => {
      const duration = ts.duration || 0 // phút, max 480 (8h)
      const rawStart = ts.startHour || '08:30'

      // Parse giờ vào
      const [startH, startM] = rawStart.split(':').map(Number)

      // Làm tròn giờ vào LÊN mốc 15 phút
      let rounded = roundUpTo15Minutes(startH, startM)
      let startMinutes = rounded.hour * 60 + rounded.minute

      // Nếu giờ vào nằm trong khoảng nghỉ trưa thì chuyển về lúc kết thúc nghỉ trưa
      const lunchStart = 12 * 60
      const lunchEnd = timesheetType === 30 ? 13 * 60 : 13 * 60 + 30
      if (startMinutes >= lunchStart && startMinutes < lunchEnd) {
        startMinutes = lunchEnd
        rounded = { hour: Math.floor(lunchEnd / 60), minute: lunchEnd % 60 }
      }
      const startHour = getTimeString(rounded.hour, rounded.minute)

      // Tính giờ ra tạm (chưa cộng nghỉ trưa)
      let endMinutes = startMinutes + duration

      // Tính thời gian nghỉ trưa cần cộng thêm
      const lunchBreak = calculateLunchBreak(startMinutes, endMinutes, timesheetType)
      endMinutes += lunchBreak

      // Giới hạn giờ ra tối đa theo timesheetType
      const maxEndMinutes = timesheetType === 30 ? 18 * 60 : 18 * 60 + 30 // 18:00 hoặc 18:30
      if (endMinutes > maxEndMinutes) {
        endMinutes = maxEndMinutes
      }

      // Chuyển về giờ:phút
      const endH = Math.floor(endMinutes / 60)
      const endM = endMinutes % 60
      const endHour = getTimeString(endH, endM)

      return {
        ...ts,
        startHour,
        endHour,
        duration
      }
    })

    return {
      ...record,
      timesheets: formattedTimesheets
    }
  })
}
