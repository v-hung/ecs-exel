import ExcelJS from 'exceljs'
import * as fs from 'fs'
import { dialog } from 'electron'
import { AttendanceRecordForExport, Project } from '../types/attendance.type'
import { getFilePath } from '../utils/file.utils'
import { ATTENDANCE_CONST } from '../constants/attendance.const'
import { format, isWeekend } from 'date-fns'

export class ExcelExportService {
  /**
   * Export dữ liệu chấm công ra file Excel dựa trên template
   */
  async exportAttendance(
    attendanceData: AttendanceRecordForExport[],
    startDate: Date,
    endDate: Date,
    projects: Project[]
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // 1. Chọn nơi lưu file trước
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

      // 2. Copy template file đến vị trí đích
      const templatePath = getFilePath(ATTENDANCE_CONST.TEMPLATE_FILE_PATH)
      if (!fs.existsSync(templatePath)) {
        throw new Error('Không tìm thấy file template: ' + templatePath)
      }

      fs.copyFileSync(templatePath, result.filePath)

      // 3. Đọc file đã copy để modify (với options để xử lý shape)
      const workbook = new ExcelJS.Workbook()

      // Đọc file với options để bỏ qua hoặc xử lý shape an toàn
      await workbook.xlsx.readFile(result.filePath)

      // Lấy worksheet đầu tiên
      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        throw new Error('Template không có worksheet')
      }

      // 4. Tính số ngày trong khoảng thời gian
      const dateRange = this.getDateRange(startDate, endDate)

      // 5. Điền header thông tin tổng quan
      this.fillHeaders(worksheet, dateRange)

      // 6. Tạo các cột ngày tháng từ E4 trở đi
      await this.fillDateColumns(worksheet, dateRange)

      // 7. Điền dữ liệu chấm công
      await this.fillAttendanceData(worksheet, attendanceData, dateRange, projects)

      // 8. Ghi lại file
      await workbook.xlsx.writeFile(result.filePath)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Export Excel error:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * Tạo các cột ngày tháng từ cột E trở đi
   * Template có sẵn 31 cột, xóa các cột thừa nếu tháng có ít hơn 31 ngày
   */
  private async fillDateColumns(worksheet: ExcelJS.Worksheet, dates: Date[]): Promise<void> {
    const templateColIndex = 5 // Cột E (1-indexed: A=1, B=2, C=3, D=4, E=5)
    const maxDaysInMonth = 31 // Template có sẵn 31 cột

    // Xóa các cột thừa (nếu tháng có ít hơn 31 ngày)
    const columnsToDelete = maxDaysInMonth - dates.length
    if (columnsToDelete > 0) {
      // Xóa từ cột sau ngày cuối cùng
      worksheet.spliceColumns(templateColIndex + dates.length, columnsToDelete)
    }

    // Set giá trị và format cho các cột ngày
    dates.forEach((date, index) => {
      const currentColIndex = templateColIndex + index

      const headerCell = worksheet.getCell(4, currentColIndex)
      const headerCell2 = worksheet.getCell(5, currentColIndex)

      // Lưu style gốc trước khi modify
      const originalStyle = { ...headerCell.style }
      const originalStyle2 = { ...headerCell2.style }

      // Set công thức cho row 4
      if (index === 0) {
        // Ngày đầu tiên = E1
        headerCell.value = { formula: '=E1' }
      } else {
        // Các ngày tiếp theo = E4 + 1, F4 + 1, ...
        const prevColLetter = this.getColumnLetter(currentColIndex - 1)
        headerCell.value = { formula: `=${prevColLetter}4+1` }
      }

      // Đổi màu nếu là cuối tuần (Saturday/Sunday)
      if (isWeekend(date)) {
        headerCell.style = {
          ...originalStyle,
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.gray }
          }
        }
        headerCell2.style = {
          ...originalStyle2,
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.gray }
          }
        }
      }
    })
  }

  /**
   * Điền dữ liệu chấm công vào bảng
   * Mỗi user có nhiều rows: start time, closing time, break time, day total, và các projects
   */
  private async fillAttendanceData(
    worksheet: ExcelJS.Worksheet,
    attendanceData: AttendanceRecordForExport[],
    dates: Date[],
    projects: Project[] = []
  ): Promise<void> {
    const startRow = 6 // Dòng bắt đầu data (row 6)
    const rowsPerUser = 5 + projects.length // 4 time rows + W.T.total + project rows

    attendanceData.forEach((record, recordIndex) => {
      const currentRow = startRow + recordIndex * rowsPerUser

      // User thứ 2 trở đi: copy rows từ template user đầu tiên
      if (recordIndex > 0) {
        this.copyUserRows(worksheet, startRow, currentRow, rowsPerUser)
      }

      // Điền thông tin user
      this.fillUserInfo(worksheet, currentRow, recordIndex, record)

      // Điền label cho 4 time rows
      this.fillTimeLabels(worksheet, currentRow, projects.length)

      // Điền label cho project rows
      this.fillProjectLabels(worksheet, currentRow, projects, record)

      // Điền dữ liệu theo ngày
      this.fillDailyData(worksheet, currentRow, record, dates, projects)

      // Điền cột W.T.total
      this.fillTotalColumn(worksheet, currentRow, dates, projects)
    })
  }

  /**
   * Copy rows template cho user mới
   */
  private copyUserRows(
    worksheet: ExcelJS.Worksheet,
    templateStartRow: number,
    targetRow: number,
    rowCount: number
  ): void {
    // Insert rows mới
    worksheet.spliceRows(targetRow, 0, ...Array(rowCount).fill([]))

    // Copy style và format từ template
    for (let i = 0; i < rowCount; i++) {
      const templateRow = worksheet.getRow(templateStartRow + i)
      const newRow = worksheet.getRow(targetRow + i)

      // Copy height
      newRow.height = templateRow.height

      // Copy từng cell
      templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber)

        // Copy value (nội dung)
        // if (cell.value) {
        //   newCell.value = cell.value
        // }

        // Copy style
        if (cell.style) {
          newCell.style = { ...cell.style }
        }

        // Copy border
        if (cell.border) {
          newCell.border = { ...cell.border }
        }
      })
    }
  }

  /**
   * Điền thông tin user (STT, Name)
   */
  private fillUserInfo(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    recordIndex: number,
    record: AttendanceRecordForExport
  ): void {
    // STT (cột A)
    const sttCell = worksheet.getCell(currentRow, 1)
    sttCell.value = recordIndex + 1

    // Name (cột B)
    const nameCell = worksheet.getCell(currentRow, 2)
    nameCell.value = record.user.name

    // Name (cột B)
    const projectNameCell = worksheet.getCell(currentRow + 1, 2)
    projectNameCell.value = record.project.name
  }

  /**
   * Điền label cho 4 time rows
   */
  private fillTimeLabels(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    projectCount: number
  ): void {
    worksheet.getCell(currentRow, 3).value = 'start time'
    worksheet.getCell(currentRow + 1, 3).value = 'closing time'
    worksheet.getCell(currentRow + 2, 3).value = 'break time'
    worksheet.getCell(currentRow + 3, 3).value = 'day total'
    worksheet.getCell(currentRow + 4, 3).value = 'Working Time'
    worksheet.getCell(currentRow + 4 + projectCount, 3).value = 'W.T.total'
  }

  /**
   * Điền label cho project rows
   */
  private fillProjectLabels(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    projects: Project[],
    record: AttendanceRecordForExport
  ): void {
    projects.forEach((project, projectIndex) => {
      const projectCell = worksheet.getCell(currentRow + 4 + projectIndex, 4)
      projectCell.value = `Prj.#${project.id}`

      // Nếu là project của user, đổi màu chữ đỏ
      const currentFont = projectCell.font || {}
      const isUserProject = record.project.id === project.id

      projectCell.font = {
        ...currentFont,
        color: { argb: isUserProject ? COLORS.red : COLORS.black }
      }
    })
  }

  /**
   * Điền dữ liệu theo ngày
   */
  private fillDailyData(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    record: AttendanceRecordForExport,
    dates: Date[],
    projects: Project[]
  ): void {
    const templateColIndex = 5 // Cột E

    dates.forEach((date, dateIndex) => {
      const currentColIndex = templateColIndex + dateIndex

      // Tìm timesheet cho ngày này
      const timesheet = record.timesheets[dateIndex]

      if (timesheet) {
        this.fillTimeData(worksheet, currentRow, currentColIndex, timesheet)
        this.fillProjectData(worksheet, currentRow, currentColIndex, projects, record)
      }

      // day total - để công thức Excel tự tính (=E7-E6-E8)
      const colLetter = this.getColumnLetter(currentColIndex)
      const totalCell = worksheet.getCell(currentRow + 3, currentColIndex)
      totalCell.value = {
        formula: `=${colLetter}${currentRow + 1}-${colLetter}${currentRow}-${colLetter}${currentRow + 2}`
      }
    })
  }

  /**
   * Điền dữ liệu thời gian (4 rows)
   */
  private fillTimeData(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    colIndex: number,
    timesheet: any
  ): void {
    // Row 1: start time
    const startCell = worksheet.getCell(currentRow, colIndex)
    if (timesheet.startHour) {
      startCell.value = this.convertTimeStringToExcelValue(timesheet.startHour)
    }

    // Row 2: closing time
    const endCell = worksheet.getCell(currentRow + 1, colIndex)
    if (timesheet.endHour) {
      endCell.value = this.convertTimeStringToExcelValue(timesheet.endHour)
    }

    // Row 3: break time - dựa theo timesheetType
    // timesheetType = 30 -> 1:00:00, timesheetType = 0 -> 1:30:00
    const breakTime = timesheet.timesheetType === 30 ? '1:00:00' : '1:30:00'
    const breakCell = worksheet.getCell(currentRow + 2, colIndex)
    breakCell.value = this.convertTimeStringToExcelValue(breakTime)

    // // Row 4: day total - để công thức Excel tự tính (=E7-E6-E8)
    // const colLetter = this.getColumnLetter(colIndex)
    // const totalCell = worksheet.getCell(currentRow + 3, colIndex)
    // totalCell.value = {
    //   formula: `=${colLetter}${currentRow + 1}-${colLetter}${currentRow}-${colLetter}${currentRow + 2}`
    // }
  }

  /**
   * Chuyển index cột sang chữ cái (1 -> A, 2 -> B, ...)
   */
  private getColumnLetter(colIndex: number): string {
    let letter = ''
    let temp = colIndex
    while (temp > 0) {
      const remainder = (temp - 1) % 26
      letter = String.fromCharCode(65 + remainder) + letter
      temp = Math.floor((temp - 1) / 26)
    }
    return letter
  }

  /**
   * Chuyển string time (HH:mm:ss) sang Excel time value (số thập phân)
   * Ví dụ: '1:00:00' -> 0.041666... (1/24)
   */
  private convertTimeStringToExcelValue(timeString: string): number {
    if (!timeString) return 0

    const parts = timeString.split(':')
    const hours = parseInt(parts[0] || '0', 10)
    const minutes = parseInt(parts[1] || '0', 10)
    const seconds = parseInt(parts[2] || '0', 10)

    // Excel time: 1 = 24 giờ, 1/24 = 1 giờ, 1/1440 = 1 phút, 1/86400 = 1 giây
    return hours / 24 + minutes / 1440 + seconds / 86400
  }

  /**
   * Điền dữ liệu project (N rows)
   */
  private fillProjectData(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    colIndex: number,
    projects: Project[],
    record: AttendanceRecordForExport
  ): void {
    const colLetter = this.getColumnLetter(colIndex)

    projects.forEach((project, projectIndex) => {
      const projectCell = worksheet.getCell(currentRow + 4 + projectIndex, colIndex)

      if (record.project.id === project.id) {
        // Project của user -> bằng day total (reference đến cell day total)
        projectCell.value = {
          formula: `=${colLetter}${currentRow + 3}`
        }
      } else {
        // Không phải project của user -> 0:00:00
        projectCell.value = this.convertTimeStringToExcelValue('0:00:00')
      }
    })
  }

  /**
   * Điền row W.T.total (tổng các project)
   */
  private fillTotalColumn(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    dates: Date[],
    projects: Project[]
  ): void {
    const templateColIndex = 5 // Cột E
    const firstProjectRow = currentRow + 4
    const lastProjectRow = currentRow + 4 + projects.length - 1
    const totalRowIndex = currentRow + 4 + projects.length // W.T.total ở cuối cùng sau các project

    // Điền công thức cho từng ngày trong W.T.total row
    dates.forEach((_, dateIndex) => {
      const currentColIndex = templateColIndex + dateIndex
      const colLetter = this.getColumnLetter(currentColIndex)
      const wtCell = worksheet.getCell(totalRowIndex, currentColIndex)

      // Tổng các project rows
      wtCell.value = {
        formula: `=SUM(${colLetter}${firstProjectRow}:${colLetter}${lastProjectRow})`
      }
    })
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
  private fillHeaders(worksheet: ExcelJS.Worksheet, dates: Date[]): void {
    const businessDaysCount = dates.filter((date) => !isWeekend(date)).length

    // E1: Ngày bắt đầu
    const startDateCell = worksheet.getCell(1, 5)
    startDateCell.value = dates[0]

    // H2: Số ngày làm việc
    const businessDaysCell = worksheet.getCell(2, 8)
    businessDaysCell.value = businessDaysCount
  }
}

// Export singleton instance
export const excelExportService = new ExcelExportService()

const COLORS = {
  gray: 'FFD9D9D9',
  green: 'FFC6E0B4',
  red: 'FFFF0000',
  cyan: 'FFCCFFFF',
  yellow: 'FFFFFFCC',
  black: 'FF000000'
}
