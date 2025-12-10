import type { Employee } from '../types/attendance.type'

/**
 * Tạo dữ liệu chấm công mẫu
 */
export function generateAttendanceData(
  employees: Employee[],
  startDate: string,
  endDate: string
): any[][] {
  const data: any[][] = []

  // Header
  data.push(['STT', 'Họ và tên', 'Phòng ban', 'Ngày', 'Giờ vào', 'Giờ ra', 'Số giờ', 'Trạng thái'])

  let stt = 1
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Duyệt qua từng nhân viên
  employees.forEach((emp) => {
    // Duyệt qua từng ngày
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date)
      const dayOfWeek = currentDate.getDay()

      // Bỏ qua chủ nhật
      if (dayOfWeek === 0) continue

      const dateStr = currentDate.toLocaleDateString('vi-VN')

      // Random giờ vào, ra và trạng thái
      const statuses = ['Đúng giờ', 'Đi muộn', 'Về sớm', 'Nghỉ phép']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

      let timeIn = '08:00'
      let timeOut = '17:00'
      let hours = '8.0'

      if (randomStatus === 'Đi muộn') {
        timeIn = '08:30'
        hours = '7.5'
      } else if (randomStatus === 'Về sớm') {
        timeOut = '16:30'
        hours = '7.5'
      } else if (randomStatus === 'Nghỉ phép') {
        timeIn = '-'
        timeOut = '-'
        hours = '0'
      }

      data.push([stt++, emp.name, emp.department, dateStr, timeIn, timeOut, hours, randomStatus])
    }
  })

  return data
}
