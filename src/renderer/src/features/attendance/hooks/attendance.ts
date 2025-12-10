import { useState, useEffect } from 'react'
import { AttendanceRecord, GetAttendanceParams } from 'src/main/types/attendance.type'
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
