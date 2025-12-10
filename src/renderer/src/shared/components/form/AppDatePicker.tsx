import { DatePicker as AntdDatePicker } from 'antd'
import dateFnsGenerateConfig from '@rc-component/picker/es/generate/dateFns'

const AppDatePicker = AntdDatePicker.generatePicker<Date>(dateFnsGenerateConfig)

export default AppDatePicker
