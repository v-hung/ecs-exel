import { Calendar as AntdCalendar } from 'antd'
import dateFnsGenerateConfig from '@rc-component/picker/es/generate/dateFns'

const AppCalendar = AntdCalendar.generateCalendar<Date>(dateFnsGenerateConfig)

export default AppCalendar
