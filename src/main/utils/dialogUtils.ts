import { dialog } from 'electron'

/**
 * Hiển thị dialog lưu file Excel
 */
export async function showSaveDialog(
  startDate: string,
  endDate: string
): Promise<string | undefined> {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Lưu file chấm công',
    defaultPath: `ChamCong_${startDate}_${endDate}.xlsx`,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  })

  return filePath
}
