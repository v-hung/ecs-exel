import { Card, Form, Space, message, Button } from 'antd'
import { UserOutlined, EyeOutlined, FileExcelOutlined } from '@ant-design/icons'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { TransferProps } from 'antd'

import { DateRangeSelector } from '@renderer/features/attendance/components/DateRangeSelector'
import { EmployeeTransfer } from '@renderer/features/attendance/components/EmployeeTransfer'
import { useUsers } from '@renderer/features/attendance/hooks/users'
import { useAttendanceStore } from '@renderer/stores/attendanceStore'
import { LoaderFunction, useNavigate } from 'react-router'
import DefaultPage from '@renderer/layouts/default/components/DefaultPage/DefaultPage'

export const loader: LoaderFunction = async () => {
  return null
}

export function Component() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { selectedEmployeeIds, setSelectedEmployeeIds } = useAttendanceStore()

  const { loading, users } = useUsers()

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setSelectedEmployeeIds(nextTargetKeys)
  }

  const handlePreview = async () => {
    try {
      const values = await form.validateFields()
      const { dateRange } = values

      if (!selectedEmployeeIds.length) {
        message.warning('Vui lòng chọn ít nhất một nhân viên!')
        return
      }

      const startDate = format(dateRange[0], 'yyyy-MM-dd')
      const endDate = format(dateRange[1], 'yyyy-MM-dd')
      const userIds = selectedEmployeeIds.join(',')

      navigate(`/attendance/preview?startDate=${startDate}&endDate=${endDate}&userIds=${userIds}`)
    } catch (error) {
      console.error('Validation error:', error)
      message.error('Vui lòng nhập đầy đủ thông tin!')
    }
  }

  const handleExport = async () => {
    try {
      const values = await form.validateFields()
      const { dateRange } = values

      if (!selectedEmployeeIds.length) {
        message.warning('Vui lòng chọn ít nhất một nhân viên!')
        return
      }

      message.info('Chức năng xuất Excel trực tiếp đang được phát triển...')
      // TODO: Implement direct export
    } catch (error) {
      console.error('Export error:', error)
      message.error('Vui lòng nhập đầy đủ thông tin!')
    }
  }

  return (
    <DefaultPage>
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
            <Form.Item style={{ flex: 'none', marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  disabled={loading}
                  size="large"
                  style={{ flex: 1 }}
                >
                  Xem trước
                </Button>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExport}
                  disabled={loading}
                  size="large"
                  style={{ flex: 1 }}
                >
                  Xuất Excel
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </DefaultPage>
  )
}
