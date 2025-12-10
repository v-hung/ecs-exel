import { ipcMain } from 'electron'
import { generateAttendanceData } from '../utils/attendanceGenerator'
import { createWorkbook, saveWorkbook } from '../utils/excelUtils'
import { showSaveDialog } from '../utils/dialogUtils'
import { attendanceService } from '../services/attendance.service'
import { AttendanceRecord, GetAttendanceParams } from '../types/attendance.type'
import { ApiResponse } from '../types/response.type'

/**
 * Đăng ký IPC handler cho xuất file chấm công
 */
export function registerAttendanceHandlers(): void {
  // Lấy dữ liệu attendance
  ipcMain.handle(
    'attendance:getData',
    async (_event, params: GetAttendanceParams): Promise<ApiResponse<AttendanceRecord[]>> => {
      try {
        const data = await attendanceService.getAttendanceData(params)
        return {
          success: true,
          data
        }
      } catch (error) {
        console.error('Get attendance data error:', error)
        return {
          success: false,
          error: (error as Error).message
        }
      }
    }
  )

  // Export attendance
  ipcMain.handle('export-attendance', async (event, data: any): Promise<any> => {
    try {
      const { employees, startDate, endDate } = data

      // Tạo dữ liệu chấm công
      const attendanceData = generateAttendanceData(employees, startDate, endDate)

      // Tạo workbook
      const wb = createWorkbook(attendanceData)

      // Hiển thị dialog lưu file
      const filePath = await showSaveDialog(startDate, endDate)

      if (filePath) {
        saveWorkbook(wb, filePath)
        return { success: true }
      } else {
        return { success: false, error: 'Người dùng đã hủy' }
      }
    } catch (error) {
      console.error('Export error:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
