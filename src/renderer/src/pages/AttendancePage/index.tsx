import { Card, Form, Space, message, Button } from 'antd'
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { startOfMonth, endOfMonth } from 'date-fns'
import { format } from '@renderer/utils/date.utils'
import type { TransferProps } from 'antd'

import { DateRangeSelector } from '@renderer/features/attendance/components/DateRangeSelector'
import { EmployeeTransfer } from '@renderer/features/attendance/components/EmployeeTransfer'
import { useUsers } from '@renderer/features/attendance/hooks/users'
import { useAttendanceStore } from '@renderer/stores/attendanceStore'
import { useAttendanceSession } from '@renderer/contexts/AttendanceSessionContext'
import { LoaderFunction, useNavigate } from 'react-router'

export const loader: LoaderFunction = async () => {
  return null
}

export function Component() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { selectedEmployeeIds, setSelectedEmployeeIds } = useAttendanceStore()
  const { setDateRange, setStep } = useAttendanceSession()

  const { loading, users } = useUsers()

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setSelectedEmployeeIds(nextTargetKeys.map((key) => Number(key)))
  }

  const handleNext = async () => {
    try {
      const values = await form.validateFields()
      const { dateRange } = values

      if (!selectedEmployeeIds.length) {
        message.warning('Vui lòng chọn ít nhất một nhân viên!')
        return
      }

      const startDate = format(dateRange[0], 'yyyy-MM-dd')
      const endDate = format(dateRange[1], 'yyyy-MM-dd')

      // Save to context instead of URL params
      setDateRange(startDate, endDate)
      setStep('projects')
      navigate('/attendance/projects')
    } catch (error) {
      console.error('Validation error:', error)
      message.error('Vui lòng nhập đầy đủ thông tin!')
    }
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh', height: '550px', background: '#f8fafd' }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>Xuất báo cáo chấm công</span>
          </Space>
        }
        styles={{
          root: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1200px',
            margin: '0 auto',
            height: '100%'
          },
          body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }
        }}
        extra={
          <Space>
            <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
              Tiếp tục
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            dateRange: [startOfMonth(new Date()), endOfMonth(new Date())]
          }}
          style={{ display: 'flex', flexDirection: 'column', flex: '1' }}
        >
          <DateRangeSelector />
          <EmployeeTransfer
            dataSource={users}
            targetKeys={selectedEmployeeIds}
            onChange={onChange}
            loading={loading}
          />
          {/* <Form.Item style={{ flex: 'none', marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                  type="default"
                  icon={<FileExcelOutlined />}
                  onClick={handleExport}
                  disabled={loading}
                  size="large"
                  style={{ flex: 1 }}
                >
                  Xuất Excel
                </Button>
            </div>
          </Form.Item> */}
        </Form>
      </Card>
    </div>
  )
}
