import { ipcMain } from 'electron'
import { attendanceService } from '../services/attendance.service'
import {
  AttendanceRecord,
  ExportAttendanceParams,
  GetAttendanceParams
} from '../types/attendance.type'
import { ApiResponse } from '../types/response.type'
import { excelExportService } from '../services/excel-export.service'

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
  ipcMain.handle(
    'attendance:export',
    async (_event, params: ExportAttendanceParams): Promise<any> => {
      try {
        const { users, startDate, endDate } = params

        // Lấy data attendance
        const attendanceData = await attendanceService.getAttendanceData({
          userIds: users.map((u) => u.id),
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        })

        // Export to Excel
        const result = await excelExportService.exportAttendance(
          attendanceData,
          new Date(startDate),
          new Date(endDate)
        )

        return result
      } catch (error) {
        console.error('Export error:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )
}
