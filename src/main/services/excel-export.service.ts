import * as XLSX from 'xlsx'
import * as fs from 'fs'
import { dialog } from 'electron'
import { AttendanceRecord } from '../types/attendance.type'
import { getFilePath } from '../utils/file.utils'
import { ATTENDANCE_CONST } from '../constants/attendance.const'
import { format } from 'date-fns'

export class ExcelExportService {
  /**
   * Export dữ liệu chấm công ra file Excel dựa trên template
   */
  async exportAttendance(
    attendanceData: AttendanceRecord[],
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // 1. Đọc template Excel
      const templatePath = getFilePath(ATTENDANCE_CONST.TEMPLATE_FILE_PATH)

      console.log('Template path:', templatePath)
      console.log('File exists:', fs.existsSync(templatePath))

      if (!fs.existsSync(templatePath)) {
        throw new Error('Không tìm thấy file template: ' + templatePath)
      }

      const templateBuffer = fs.readFileSync(templatePath)
      const workbook = XLSX.read(templateBuffer, { type: 'buffer', cellStyles: true })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      // 2. Tính số ngày trong khoảng thời gian
      const dateRange = this.getDateRange(startDate, endDate)

      // 3. Tìm dòng template (giả sử dòng 3 là template cần copy)
      const templateRowIndex = 3 // Dòng mẫu trong Excel (1-based)
      const startDataRow = 4 // Bắt đầu điền data từ dòng này

      // 4. Điền header ngày tháng (nếu cần)
      this.fillDateHeaders(worksheet, dateRange, 3) // Bắt đầu từ cột D (index 3)

      // 5. Copy template và điền data cho từng user
      attendanceData.forEach((record, index) => {
        const currentRow = startDataRow + index
        const user = record.user

        // Điền thông tin user
        this.setCellValue(worksheet, `A${currentRow}`, index + 1, 'n') // STT
        this.setCellValue(worksheet, `B${currentRow}`, user.name, 's') // Tên
        this.setCellValue(worksheet, `C${currentRow}`, user.username, 's') // Username

        // Tạo map timesheet theo ngày để dễ tìm
        const timesheetMap = new Map(
          record.timesheets.map((ts) => {
            const dateKey = new Date(ts.dateTime).toISOString().split('T')[0]
            return [dateKey, ts]
          })
        )

        // Điền timesheets theo từng ngày
        dateRange.forEach((date, dayIndex) => {
          const dateKey = date.toISOString().split('T')[0]
          const timesheet = timesheetMap.get(dateKey)
          const colIndex = 3 + dayIndex // Cột D trở đi (D=3, E=4, ...)
          const col = XLSX.utils.encode_col(colIndex)

          if (timesheet && timesheet.duration) {
            // Có dữ liệu chấm công
            const hours = Math.floor(timesheet.duration / 60)
            const minutes = timesheet.duration % 60
            const timeStr = `${hours}:${String(minutes).padStart(2, '0')}`
            this.setCellValue(worksheet, `${col}${currentRow}`, timeStr, 's')
          } else {
            // Không có dữ liệu
            this.setCellValue(worksheet, `${col}${currentRow}`, '-', 's')
          }
        })
      })

      // 6. Chọn nơi lưu file
      const currentDate = new Date()
      const defaultFileName = format(currentDate, ATTENDANCE_CONST.EXPORT_FILE_NAME)

      const result = await dialog.showSaveDialog({
        title: 'Lưu file Excel',
        defaultPath: defaultFileName,
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Đã hủy lưu file' }
      }

      // 7. Ghi file
      const outputBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      fs.writeFileSync(result.filePath, outputBuffer)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Export Excel error:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * Tạo mảng các ngày trong khoảng thời gian
   */
  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  /**
   * Điền header ngày tháng vào dòng đầu
   */
  private fillDateHeaders(worksheet: XLSX.WorkSheet, dates: Date[], startColIndex: number): void {
    dates.forEach((date, index) => {
      const col = XLSX.utils.encode_col(startColIndex + index)
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`
      this.setCellValue(worksheet, `${col}2`, dateStr, 's') // Dòng 2 cho header ngày
    })
  }

  /**
   * Set giá trị cho cell
   */
  private setCellValue(
    worksheet: XLSX.WorkSheet,
    cellAddress: string,
    value: string | number,
    type: 's' | 'n'
  ): void {
    worksheet[cellAddress] = { t: type, v: value }
  }
}

// Export singleton instance
export const excelExportService = new ExcelExportService()
