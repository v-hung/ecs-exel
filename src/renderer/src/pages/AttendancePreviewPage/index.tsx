import { Card, Button, Space, message, Typography, Spin } from 'antd'
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { eachDayOfInterval, isWeekend, parseISO } from 'date-fns'
import { useNavigate } from 'react-router'
import {
  useAttendanceData,
  useAttendanceExport
} from '@renderer/features/attendance/hooks/attendance'
import { useAttendanceSession } from '@renderer/contexts/AttendanceSessionContext'
import { useAttendanceStore } from '@renderer/stores/attendanceStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useMemo } from 'react'
import { transformAttendanceData } from '../../features/attendance/hooks/dataTransform'
import './style.css'
import { AttendanceTableHTML } from '@renderer/features/attendance/components/AttendanceTableHTML'
import { ExportAttendanceParams } from 'src/main/types/attendance.type'

const { Text } = Typography

export function Component() {
  const navigate = useNavigate()
  const { startDate, endDate } = useAttendanceSession()
  const { selectedEmployeeIds } = useAttendanceStore()
  const { projects } = useProjectStore()

  const attendanceParams = useMemo(
    () => ({
      userIds: selectedEmployeeIds as number[],
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date()
    }),
    [selectedEmployeeIds, startDate, endDate]
  )

  const { loading, data } = useAttendanceData(attendanceParams)
  const { exporting, exportAttendance } = useAttendanceExport()

  const handleExport = async () => {
    const params: ExportAttendanceParams = {
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      users: selectedEmployeeIds.map((id) => {
        const project = projects.find((p) => p.id === id)
        return {
          id,
          projectId: project ? project.id : 0,
          projectName: project ? project.name : ''
        }
      })
    }
    await exportAttendance(params, {
      onSuccess: () => {
        message.success('Xuất file Excel thành công!')
      },
      onError: (error) => {
        message.error('Lỗi khi xuất file: ' + error)
      }
    })
  }

  const dateRange = useMemo(
    () =>
      startDate && endDate
        ? eachDayOfInterval({
            start: parseISO(startDate),
            end: parseISO(endDate)
          })
        : [],
    [startDate, endDate]
  )

  const businessDays = useMemo(() => dateRange.filter((date) => !isWeekend(date)), [dateRange])

  const { rows, projects: projectList } = useMemo(
    () => transformAttendanceData(data, projects),
    [data, projects]
  )

  return (
    <Spin spinning={exporting}>
      <div className="attendance-preview">
        <Card
          title={
            <Space>
              <span>Báo cáo thời gian làm việc</span>
              {startDate && endDate && (
                <Text type="secondary">
                  ({startDate} - {endDate})
                </Text>
              )}
            </Space>
          }
          extra={
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/attendance/projects')}>
                Quay lại
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={loading}
              >
                Xuất Excel
              </Button>
            </Space>
          }
          styles={{
            root: {
              display: 'flex',
              flexDirection: 'column',
              // maxWidth: '1200px',
              margin: '0 auto',
              height: '100%'
            },
            body: {
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch'
            }
          }}
        >
          <div className="report-info" style={{ flex: 'none' }}>
            <Text strong>Số ngày làm việc: </Text>
            <Text>{businessDays.length} ngày</Text>
          </div>
          <AttendanceTableHTML
            loading={loading}
            rows={rows}
            projects={projectList}
            dateRange={dateRange}
          />
        </Card>
      </div>
    </Spin>
  )
}
