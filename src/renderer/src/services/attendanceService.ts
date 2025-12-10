import type { AttendanceExportData, ExportResult } from '../types/employee'

export const exportAttendance = async (data: AttendanceExportData): Promise<ExportResult> => {
  try {
    const result = await window.electron.ipcRenderer.invoke('export-attendance', data)
    return result
  } catch (error) {
    console.error('Export error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
