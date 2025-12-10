import * as XLSX from 'xlsx'

/**
 * Tạo Excel workbook từ dữ liệu
 */
export function createWorkbook(data: any[][]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Định dạng độ rộng cột
  ws['!cols'] = [
    { wch: 5 }, // STT
    { wch: 20 }, // Họ tên
    { wch: 15 }, // Phòng ban
    { wch: 12 }, // Ngày
    { wch: 10 }, // Giờ vào
    { wch: 10 }, // Giờ ra
    { wch: 10 }, // Số giờ
    { wch: 15 } // Trạng thái
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Chấm công')

  return wb
}

/**
 * Lưu workbook vào file
 */
export function saveWorkbook(wb: XLSX.WorkBook, filePath: string): void {
  XLSX.writeFile(wb, filePath)
}
