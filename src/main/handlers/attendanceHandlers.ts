import { ipcMain } from 'electron'
import { attendanceService } from '../services/attendance.service'
import {
  AttendanceRecord,
  AttendanceRecordForExport,
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
        const { users, startDate, endDate, projects } = params

        // Lấy data attendance
        const attendanceData = await attendanceService.getAttendanceData({
          userIds: users.map((u) => u.id),
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        })

        // Map data sang format cho export (thêm project info)
        const exportData: AttendanceRecordForExport[] = attendanceData.map((record) => {
          // Tìm user này trong danh sách users để lấy projectId
          const userInfo = users.find((u) => u.id === record.user.id)

          return {
            ...record,
            project: {
              id: userInfo ? userInfo.projectId : 0,
              name: userInfo ? userInfo.projectName : 'N/A'
            }
          }
        })

        // Export to Excel
        const result = await excelExportService.exportAttendance(
          exportData,
          new Date(startDate),
          new Date(endDate),
          projects
        )

        return result
      } catch (error) {
        console.error('Export error:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )
}
