import { Card, Button, Space, Table, Spin, message, Typography } from 'antd'
import { DownloadOutlined, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import { format, eachDayOfInterval, isWeekend, parseISO } from 'date-fns'
import { LoaderFunction, redirect, useNavigate, useSearchParams } from 'react-router'
import { AttendanceRecord } from 'src/main/types/attendance.type'
import { useAttendanceData } from '@renderer/features/attendance/hooks/attendance'

const { Title, Text } = Typography

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const userIds = url.searchParams.get('userIds')

  if (!startDate || !endDate || !userIds) {
    throw redirect('/')
  }

  return { startDate, endDate, userIds }
}

export function Component() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const userIds = searchParams.get('userIds')?.split(',').map(Number) || []

  const { loading, error, data } = useAttendanceData({
    userIds,
    startDate: new Date(startDate!),
    endDate: new Date(endDate!)
  })

  const handleExport = async () => {
    try {
      message.success('Đang xuất file Excel...')
      // TODO: Call export service
    } catch (error) {
      message.error('Lỗi khi xuất file!')
    }
  }

  const dateRange =
    startDate && endDate
      ? eachDayOfInterval({
          start: parseISO(startDate),
          end: parseISO(endDate)
        })
      : []

  const businessDays = dateRange.filter((date) => !isWeekend(date))

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Name',
      key: 'name',
      width: 200,
      fixed: 'left' as const,
      render: (record: AttendanceRecord) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.user.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user.username}
          </Text>
        </div>
      )
    },
    ...dateRange.map((date) => ({
      title: (
        <div className="date-header">
          <div>{format(date, 'dd/MM')}</div>
          <div className="weekday">{format(date, 'EEE')}</div>
        </div>
      ),
      key: format(date, 'yyyy-MM-dd'),
      width: 80,
      align: 'center' as const,
      className: isWeekend(date) ? 'weekend-column' : '',
      render: (record: AttendanceRecord) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const timesheet = record.timesheets.find(
          (t) => format(new Date(t.dateTime), 'yyyy-MM-dd') === dateStr
        )

        if (!timesheet) {
          return <div className="cell-empty">-</div>
        }

        const hasTicket = timesheet.tickets.length > 0
        const duration = timesheet.duration
          ? `${Math.floor(timesheet.duration / 60)}:${(timesheet.duration % 60).toString().padStart(2, '0')}`
          : '-'

        return (
          <div className={`cell-content ${hasTicket ? 'has-ticket' : ''}`}>
            <div className="time-range">
              {timesheet.startHour || '-'} ~ {timesheet.endHour || '-'}
            </div>
            <div className="duration">{duration}</div>
            {hasTicket && (
              <div className="ticket-indicator" title="Có ticket xin nghỉ/đi muộn">
                T
              </div>
            )}
          </div>
        )
      }
    })),
    {
      title: 'Total',
      key: 'total',
      width: 100,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (record: AttendanceRecord) => {
        const totalMinutes = record.timesheets.reduce((sum, ts) => sum + (ts.duration || 0), 0)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return (
          <div style={{ fontWeight: 600 }}>
            {hours}:{minutes.toString().padStart(2, '0')}
          </div>
        )
      }
    }
  ]

  return (
    <div className="attendance-preview">
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Working time report</span>
            {startDate && endDate && (
              <Text type="secondary">
                ({format(parseISO(startDate), 'dd/MM/yyyy')} -{' '}
                {format(parseISO(endDate), 'dd/MM/yyyy')})
              </Text>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/attendance')}>
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
      >
        <div className="report-info">
          <Text strong>Business days: </Text>
          <Text>{businessDays.length} days</Text>
        </div>

        <Spin spinning={loading}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey={(record) => record.user.id}
            pagination={false}
            scroll={{ x: 'max-content', y: 600 }}
            bordered
            className="attendance-table"
          />
        </Spin>
      </Card>
    </div>
  )
}
