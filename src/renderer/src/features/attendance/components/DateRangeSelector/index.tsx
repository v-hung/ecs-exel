import { Form } from 'antd'
import AppRangePicker from '../../../../shared/components/form/AppRangePicker'

export const DateRangeSelector: React.FC = () => {
  return (
    <Form.Item
      label="Khoảng thời gian"
      name="dateRange"
      rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
      style={{ flex: 'none' }}
    >
      <AppRangePicker
        style={{ width: '100%' }}
        format="DD/MM/YYYY"
        placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
      />
    </Form.Item>
  )
}
