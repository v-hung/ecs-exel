import { ComponentProps } from 'react'
import DatePicker from './AppDatePicker'
import styles from './AppTimePicker.module.css'

const { RangePicker: AntdRangePicker } = DatePicker

export type RangeTimePickerType = ComponentProps<typeof AntdRangePicker>

const AppRangeTimePicker = (props: RangeTimePickerType) => {
  const { popupClassName, ...rest } = props
  return (
    <AntdRangePicker
      popupClassName={`${styles.customPopupTimePicker} ${popupClassName ?? ''}`}
      picker="time"
      format="HH:mm:ss"
      {...rest}
    />
  )
}

export default AppRangeTimePicker
