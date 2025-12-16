import ExcelJS from '@zurmokeeper/exceljs'
import * as fs from 'fs'
import { app, dialog } from 'electron'
import { AttendanceRecordForExport, Project } from '../types/attendance.type'
import { getFilePath } from '../utils/file.utils'
import { ATTENDANCE_CONST } from '../constants/attendance.const'
import { format, isWeekend } from 'date-fns'
import { basename, extname, join } from 'path'

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

      const defaultDir = app.getPath('downloads')
      const dir = defaultDir
      const ext = extname(defaultFileName)
      const baseName = basename(defaultFileName, ext)

      let finalFileName = defaultFileName
      let counter = 1
      let checkPath = join(dir, finalFileName)

      while (fs.existsSync(checkPath)) {
        finalFileName = `${baseName} (${counter})${ext}`
        checkPath = join(dir, finalFileName)
        counter++
      }

      const result = await dialog.showSaveDialog({
        title: 'Lưu file Excel',
        defaultPath: join(dir, finalFileName), // Tên file đã tránh trùng
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Đã hủy lưu file' }
      }

      // 3. Copy template file đến vị trí đích
      const templatePath = getFilePath(ATTENDANCE_CONST.TEMPLATE_FILE_PATH)
      if (!fs.existsSync(templatePath)) {
        throw new Error('Không tìm thấy file template: ' + templatePath)
      }

      try {
        fs.copyFileSync(templatePath, result.filePath)
      } catch (error) {
        throw new Error(
          'Không thể tạo file. Vui lòng đóng file Excel nếu đang mở: ' + (error as Error).message
        )
      }

      // 4. Đọc file đã copy để modify (với options để xử lý shape)
      const workbook = new ExcelJS.Workbook()

      // Force Excel recalculate khi mở file
      workbook.calcProperties = {
        fullCalcOnLoad: true
      }

      // Đọc file
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

      // 8. Điền bảng tổng hợp project (summary table)
      this.fillProjectSummaryTable(worksheet, attendanceData, dateRange, projects)

      // 9. Cấu hình page break và page setup
      this.configurePageBreaks(worksheet, attendanceData, dateRange, projects)

      // 10. Ghi lại file
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
      // TẤT CẢ user đều copy từ template (startRow) và fill vào vị trí mới
      const targetRow = startRow + (recordIndex + 1) * rowsPerUser

      // Copy rows từ template
      this.copyUserRows(worksheet, startRow, targetRow, rowsPerUser)

      // Điền thông tin user vào vị trí mới (KHÔNG merge STT ở đây)
      this.fillUserInfo(worksheet, targetRow, recordIndex, record, rowsPerUser, false)

      // Điền label cho 4 time rows
      this.fillTimeLabels(worksheet, targetRow, projects.length)

      // Điền label cho project rows
      this.fillProjectLabels(worksheet, targetRow, projects, record)

      // Điền dữ liệu theo ngày
      this.fillDailyData(worksheet, targetRow, record, dates, projects)

      // Set màu cho project rows NGAY SAU KHI điền xong data user này
      this.applyProjectColorsToRows(worksheet, targetRow, dates, projects, record)
    })

    // Xóa template gốc ở startRow
    worksheet.spliceRows(startRow, rowsPerUser)

    // SAU KHI xóa template, điền các công thức và merge cells
    attendanceData.forEach((_, recordIndex) => {
      const currentRow = startRow + recordIndex * rowsPerUser

      // Merge STT với row numbers đúng
      worksheet.mergeCells(currentRow, 1, currentRow + rowsPerUser - 1, 1)

      // Thêm border bottom đậm cho STT cell (cuối cùng của merge range)
      const sttCell = worksheet.getCell(currentRow + rowsPerUser - 1, 1)
      sttCell.border = {
        ...sttCell.border,
        bottom: { style: 'medium' }
      }

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
    // Chèn row mới và copy lại style từ template
    for (let i = 0; i < rowCount; i++) {
      worksheet.insertRow(targetRow + i, [])
      const templateRow = worksheet.getRow(templateStartRow + i)
      const newRow = worksheet.getRow(targetRow + i)

      // Copy height
      newRow.height = templateRow.height

      // Copy từng cell
      templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber)

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
    record: AttendanceRecordForExport,
    rowsPerUser: number,
    shouldMerge: boolean = true
  ): void {
    // STT (cột A)
    const sttCell = worksheet.getCell(currentRow, 1)
    sttCell.value = recordIndex + 1

    // Merge STT nếu cần (tùy tham số)
    if (shouldMerge) {
      worksheet.mergeCells(currentRow, 1, currentRow + rowsPerUser - 1, 1)
    }

    // Name (cột B) - không merge
    const nameCell = worksheet.getCell(currentRow, 2)
    nameCell.value = record.user.name

    // Project name (cột B, row 2)
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
   * Apply màu cho project rows (toàn bộ hàng từ cột D đến cột cuối)
   * Gọi sau khi đã điền xong tất cả data của tất cả user
   */
  private applyProjectColorsToRows(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    dates: Date[],
    projects: Project[],
    record: AttendanceRecordForExport
  ): void {
    const templateColIndex = 5 // Cột E
    const totalColCount = dates.length + 1 // Số cột ngày + 1 cột total

    projects.forEach((project, projectIndex) => {
      const projectRowIndex = currentRow + 4 + projectIndex
      const isUserProject = record.project.id === project.id
      const fontColor = isUserProject ? COLORS.red : COLORS.black

      // Set màu cho cột D (label)
      const labelCell = worksheet.getCell(projectRowIndex, 4)
      labelCell.font = {
        name: 'Meiryo UI',
        size: 11,
        color: { argb: fontColor }
      }

      // Set màu cho tất cả các cột ngày (E, F, G, ...) + cột total cuối cùng
      for (let i = 0; i < totalColCount; i++) {
        const colIndex = templateColIndex + i
        const dataCell = worksheet.getCell(projectRowIndex, colIndex)
        dataCell.font = {
          name: 'Meiryo UI',
          size: 11,
          color: { argb: fontColor }
        }
      }
    })
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

    dates.forEach((_, dateIndex) => {
      const currentColIndex = templateColIndex + dateIndex

      // Tìm timesheet cho ngày này
      const timesheet = record.timesheets.find(
        (ts) => ts.dateTime.getDate() === dates[dateIndex].getDate()
      )

      if (timesheet) {
        this.fillTimeData(
          worksheet,
          currentRow,
          currentColIndex,
          timesheet,
          record.user.timesheetType || 0
        )
        this.fillProjectData(worksheet, currentRow, currentColIndex, projects, record)
      }

      // KHÔNG điền công thức day total ở đây nữa (sẽ điền sau khi xóa template)
    })
  }

  /**
   * Điền dữ liệu thời gian (4 rows)
   */
  private fillTimeData(
    worksheet: ExcelJS.Worksheet,
    currentRow: number,
    colIndex: number,
    timesheet: AttendanceRecordForExport['timesheets'][number],
    timesheetType: number
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
    // timesheetType = 30 -> 1:00:00 (nghỉ trưa đến 13:00), timesheetType = 0 -> 1:30:00 (nghỉ trưa đến 13:30)
    let breakTime = '0:00:00' // Mặc định không có nghỉ trưa

    // Lunch break: start and end
    const lunchStartMinutes = 12 * 60 // 12:00
    const lunchEndMinutes = timesheetType === 30 ? 13 * 60 : 13 * 60 + 30 // 13:00 hoặc 13:30

    if (timesheet.startHour && timesheet.endHour) {
      const [startH, startM] = timesheet.startHour.split(':').map(Number)
      const startMinutes = startH * 60 + startM

      const [endH, endM] = timesheet.endHour.split(':').map(Number)
      const endMinutes = endH * 60 + endM

      // Chỉ tính nghỉ trưa nếu khoảng làm việc CHỨA khoảng nghỉ trưa
      // Tức là: bắt đầu TRƯỚC nghỉ trưa VÀ kết thúc SAU nghỉ trưa
      if (startMinutes < lunchEndMinutes && endMinutes > lunchStartMinutes) {
        breakTime = timesheetType === 30 ? '1:00:00' : '1:30:00'
      }
    }

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
      const projectRow = currentRow + 4 + projectIndex
      const dayTotalRow = currentRow + 3
      const projectCell = worksheet.getCell(projectRow, colIndex)

      // Nếu là user đầu tiên thì không có user bên trên
      let refDayTotalRow = dayTotalRow
      if (currentRow > 6) {
        // Tính lại dòng day total của user bên trên
        const rowsPerUser = 5 + projects.length
        refDayTotalRow = currentRow - rowsPerUser + 3
      }

      if (record.project.id === project.id) {
        projectCell.value = {
          formula: `=${colLetter}${refDayTotalRow}`
        }
      } else {
        // Không phải project của user -> 0:00:00
        projectCell.value = this.convertTimeStringToExcelValue('0:00:00')
      }
    })
  }

  /**
   * Điền row W.T.total (tổng các project) và các công thức day total
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
    const totalColIndex = 5 + dates.length // Cột total (động theo số ngày)

    const firstColLetter = this.getColumnLetter(templateColIndex)
    const lastColLetter = this.getColumnLetter(templateColIndex + dates.length - 1)

    // Điền công thức day total cho từng ngày (=E7-E6-E8)
    dates.forEach((_, dateIndex) => {
      const currentColIndex = templateColIndex + dateIndex
      const colLetter = this.getColumnLetter(currentColIndex)
      const dayTotalCell = worksheet.getCell(currentRow + 3, currentColIndex)
      dayTotalCell.value = {
        formula: `=${colLetter}${currentRow + 1}-${colLetter}${currentRow}-${colLetter}${currentRow + 2}`
      }
    })

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

    // Điền cột TOTAL (tổng từ ngày đầu đến ngày cuối)
    // Row day total
    const dayTotalCell = worksheet.getCell(currentRow + 3, totalColIndex)
    dayTotalCell.value = {
      formula: `=SUM(${firstColLetter}${currentRow + 3}:${lastColLetter}${currentRow + 3})`
    }

    // Các project rows
    projects.forEach((_, projectIndex) => {
      const projectRowIndex = currentRow + 4 + projectIndex
      const projectTotalCell = worksheet.getCell(projectRowIndex, totalColIndex)
      projectTotalCell.value = {
        formula: `=SUM(${firstColLetter}${projectRowIndex}:${lastColLetter}${projectRowIndex})`
      }
    })

    // W.T.total row
    const wtTotalCell = worksheet.getCell(totalRowIndex, totalColIndex)
    wtTotalCell.value = {
      formula: `=SUM(${firstColLetter}${totalRowIndex}:${lastColLetter}${totalRowIndex})`
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
  private fillHeaders(worksheet: ExcelJS.Worksheet, dates: Date[]): void {
    const businessDaysCount = dates.filter((date) => !isWeekend(date)).length

    // E1: Ngày bắt đầu
    const startDateCell = worksheet.getCell(1, 5)
    startDateCell.value = dates[0]

    // H2: Số ngày làm việc
    const businessDaysCell = worksheet.getCell(2, 8)
    businessDaysCell.value = businessDaysCount
  }

  /**
   * Điền bảng tổng hợp project ở cuối file (template đã có sẵn)
   */
  private fillProjectSummaryTable(
    worksheet: ExcelJS.Worksheet,
    attendanceData: AttendanceRecordForExport[],
    dates: Date[],
    projects: Project[]
  ): void {
    const startRow = 6
    const rowsPerUser = 5 + projects.length
    const summaryStartRow = startRow + attendanceData.length * rowsPerUser + 3 // 3 dòng trống
    const attendanceTotalCol = 5 + dates.length // Cột total thực tế trong attendance data (động)
    const attendanceTotalColLetter = this.getColumnLetter(attendanceTotalCol)

    // Merge title row
    // Project name (E:K)
    worksheet.mergeCells(summaryStartRow, 5, summaryStartRow, 11)
    // Total header (L:M)
    worksheet.mergeCells(summaryStartRow, 12, summaryStartRow, 13)
    const totalHeaderCell = worksheet.getCell(summaryStartRow, 12)
    totalHeaderCell.border = {
      ...totalHeaderCell.border,
      right: { style: 'thin' }
    }

    // Điền từng project
    projects.forEach((project, projectIndex) => {
      const currentRow = summaryStartRow + 1 + projectIndex

      // Cột E: Project ID (Prj.#1, Prj.#2...)
      const projectIdCell = worksheet.getCell(currentRow, 5)
      projectIdCell.value = `Prj.#${project.id}`

      // Cột F:K: Project Name - merge thủ công
      const projectNameCell = worksheet.getCell(currentRow, 6)
      projectNameCell.value = project.name
      worksheet.mergeCells(currentRow, 6, currentRow, 11) // F:K

      // Ghi công thức sum đọc từ cột total ngoài cùng của attendance data
      const projectRowIndices: number[] = []
      attendanceData.forEach((_, userIndex) => {
        const userStartRow = startRow + userIndex * rowsPerUser
        const projectRowIndex = userStartRow + 4 + projectIndex
        projectRowIndices.push(projectRowIndex)
      })

      const totalCell = worksheet.getCell(currentRow, 12)
      const sumFormula = projectRowIndices
        .map((row) => `${attendanceTotalColLetter}${row}`)
        .join(',')
      totalCell.value = { formula: `=SUM(${sumFormula})` }
      // Merge total value (L:M) cho project
      worksheet.mergeCells(currentRow, 12, currentRow, 13)
      const totalHeaderCell = worksheet.getCell(summaryStartRow, 12)
      totalCell.border = {
        ...totalHeaderCell.border,
        right: { style: 'thin' }
      }
    })

    // Row tổng cuối cùng
    const totalRow = summaryStartRow + 1 + projects.length
    const firstProjectRow = summaryStartRow + 1
    const lastProjectRow = summaryStartRow + projects.length

    // KHÔNG merge E:K cho total row (chỉ có label ở cột E)
    // Merge total value (L:M)
    worksheet.mergeCells(totalRow, 12, totalRow, 13)

    // Set value - sum từ L của summary table
    const totalCell = worksheet.getCell(totalRow, 12)
    totalCell.value = {
      formula: `=SUM(L${firstProjectRow}:L${lastProjectRow})`
    }
    totalCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Occupancy rate
    const occupancyRow = summaryStartRow + 3 + projects.length
    // Occupancy value ở cột M (không merge)
    const occupancyValueCell = worksheet.getCell(occupancyRow, 13)
    // =(L155*24)/((8*H2)*(số user))
    occupancyValueCell.value = {
      formula: `=(L${totalRow}*24)/((8*H2)*(${attendanceData.length}))`
    }

    // Tạo vùng màu vàng (box) từ P đến cột total, từ summaryStartRow đến project length + 1
    const noteStartRow = summaryStartRow
    const noteEndRow = summaryStartRow + projects.length + 1
    const totalCol = 5 + dates.length // Cột total động

    // Tính toán vị trí và kích thước của image
    const startCol = 16 // Cột P

    // Thêm image vào worksheet với ImagePosition format
    worksheet.addShape(
      {
        type: 'rect',
        rotation: 0,
        fill: {
          type: 'solid',
          color: { rgb: 'FFFFCC' }
        },
        outline: {
          weight: 1,
          color: { rgb: '000000' }
        },
        textBody: {
          vertAlign: 't',
          paragraphs: [
            {
              alignment: 'l',
              runs: [
                {
                  text: ' ',
                  font: {
                    bold: false,
                    size: 11,
                    color: { rgb: '000000' }
                  }
                }
              ]
            }
          ]
        }
      },
      `${this.getColumnLetter(startCol)}${noteStartRow}:${this.getColumnLetter(totalCol)}${noteEndRow}`
    )

    // Topics / Remarks
    worksheet.mergeCells(noteStartRow - 1, 16, noteStartRow - 1, 19)
    const topicDateCell = worksheet.getCell(noteStartRow - 1, 16)
    topicDateCell.value = 'Topics / Remarks'
    topicDateCell.font = {
      name: 'Arial Black',
      size: 11,
      bold: true
    }

    // Row thông tin Reporting date và Authorizer
    const infoRow = summaryStartRow + projects.length + 5
    const totalColAuthorizer = 5 + dates.length // Cột total động

    // "Reporting date" tính ngược từ totalColAuthorizer (ví dụ: 30 ngày → totalColAuthorizer=35, Reporting=20=T)
    const reportingDateCol = totalColAuthorizer - 15

    // Merge 3 cells cho Reporting date
    worksheet.mergeCells(infoRow, reportingDateCol, infoRow, reportingDateCol + 2)
    const reportingDateCell = worksheet.getCell(infoRow, reportingDateCol)
    reportingDateCell.value = 'Reporting date'
    reportingDateCell.font = {
      name: 'Arial Black',
      size: 11,
      bold: true
    }
    reportingDateCell.border = {
      bottom: { style: 'thin' }
    }

    // Merge 3 cells cho TODAY() (cách 2 cells sau Reporting date)
    const todayStartCol = reportingDateCol + 3 // Cách 2 cells
    worksheet.mergeCells(infoRow, todayStartCol, infoRow, todayStartCol + 2) // Merge 3 cells
    const todayCell = worksheet.getCell(infoRow, todayStartCol)
    todayCell.value = { formula: '=TODAY()' }
    todayCell.numFmt = 'yyyy/MM/dd' // Format ngày tháng
    todayCell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
    todayCell.border = {
      bottom: { style: 'thin' }
    }

    // "SDC Authorizer" (cách 2 cells sau TODAY)
    const authorizerCol = todayStartCol + 5 // Cách 2 cells sau TODAY (3 cells)

    // Merge 3 cells cho SDC Authorizer
    worksheet.mergeCells(infoRow, authorizerCol, infoRow, authorizerCol + 2)
    const authorizerCell = worksheet.getCell(infoRow, authorizerCol)
    authorizerCell.value = 'SDC Authorizer'
    authorizerCell.font = {
      name: 'Arial Black',
      size: 11,
      bold: true
    }
    authorizerCell.border = {
      bottom: { style: 'thin' }
    }

    // Merge từ (cách 2 cells) đến totalColAuthorizer với text "DANG THI DIEM MY"
    const authorizerNameStartCol = authorizerCol + 3 // Cách 2 cells
    worksheet.mergeCells(infoRow, authorizerNameStartCol, infoRow, totalColAuthorizer)
    const authorizerNameCell = worksheet.getCell(infoRow, authorizerNameStartCol)
    authorizerNameCell.value = 'DANG THI DIEM MY'
    authorizerNameCell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
    authorizerNameCell.border = {
      bottom: { style: 'thin' }
    }

    // Row STNet Authorizer (3 rows bên dưới)
    const stnetRow = infoRow + 3

    // Merge 3 cells cho STNet Authorizer
    worksheet.mergeCells(stnetRow, authorizerCol, stnetRow, authorizerCol + 2)
    const stnetAuthorizerCell = worksheet.getCell(stnetRow, authorizerCol)
    stnetAuthorizerCell.value = 'STNet Authorizer'
    stnetAuthorizerCell.font = {
      name: 'Arial Black',
      size: 11,
      bold: true
    }
    stnetAuthorizerCell.border = {
      bottom: { style: 'thin' }
    }

    // Merge từ (cách 2 cells) đến totalColAuthorizer
    const stnetNameStartCol = authorizerCol + 3 // Cách 2 cells
    worksheet.mergeCells(stnetRow, stnetNameStartCol, stnetRow, totalColAuthorizer)
    const stnetNameCell = worksheet.getCell(stnetRow, stnetNameStartCol)
    stnetNameCell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
    stnetNameCell.border = {
      bottom: { style: 'thin' }
    }
  }

  /**
   * Cấu hình page breaks và page setup cho worksheet
   */
  private configurePageBreaks(
    worksheet: ExcelJS.Worksheet,
    attendanceData: AttendanceRecordForExport[],
    dates: Date[],
    projects: Project[]
  ): void {
    const startRow = 6
    const rowsPerUser = 5 + projects.length
    const attendanceEndRow = startRow + attendanceData.length * rowsPerUser
    // const summaryStartRow = attendanceEndRow + 3
    const totalCol = 5 + dates.length

    // Page setup: landscape orientation, fit to width
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: Math.ceil(attendanceData.length / 5), // Giới hạn chiều cao dựa trên số user (tính toán trang)
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    }

    // Set print area từ A1 đến cột cuối và dừng ngay sau attendance data (không in summary table)
    const attendancePrintEndRow = attendanceEndRow // +0 row sau attendance data
    const endColLetter = this.getColumnLetter(totalCol)
    worksheet.pageSetup.printArea = `A1:${endColLetter}${attendancePrintEndRow}`

    // Thêm page break sau attendance data (trước summary table)
    const pageBreakRow = worksheet.getRow(attendanceEndRow - 1)
    pageBreakRow.addPageBreak()

    // Set repeat rows (header rows) cho mỗi trang
    worksheet.pageSetup.printTitlesRow = '1:5' // Repeat rows 1-5 (header info và column headers)
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
