import { useState, useEffect } from 'react'
import {
  AttendanceRecord,
  ExportAttendanceParams,
  GetAttendanceParams
} from 'src/main/types/attendance.type'
import { ApiResponse } from 'src/main/types/response.type'

/**
 * Hook để lấy dữ liệu attendance
 */
export const useAttendanceData = (params: GetAttendanceParams | null) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (!params) {
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const result: ApiResponse<AttendanceRecord[]> = await window.electron.ipcRenderer.invoke(
          'attendance:getData',
          params
        )

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Lỗi không xác định')
        }
      } catch (err) {
        console.error('Fetch attendance data error:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  return { loading, error, data }
}

/**
 *  Hook để xuất file chấm công
 */
export const useAttendanceExport = () => {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportAttendance = async (
    params: ExportAttendanceParams,
    callbacks?: {
      onSuccess?: (filePath: string) => void
      onError?: (error: string) => void
    }
  ) => {
    try {
      setExporting(true)
      setExportError(null)

      const result = await window.electron.ipcRenderer.invoke('attendance:export', params)

      if (result.success) {
        // Gọi callback success nếu có
        callbacks?.onSuccess?.(result.filePath)
      } else {
        const errorMsg = result.error || 'Lỗi không xác định khi xuất file'
        setExportError(errorMsg)
        // Gọi callback error nếu có
        callbacks?.onError?.(errorMsg)
      }

      return result
    } catch (err) {
      console.error('Export attendance error:', err)
      const errorMsg = (err as Error).message
      setExportError(errorMsg)
      // Gọi callback error nếu có
      callbacks?.onError?.(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setExporting(false)
    }
  }

  return { exporting, exportError, exportAttendance }
}
