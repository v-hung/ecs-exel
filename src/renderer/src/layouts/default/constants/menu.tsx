import type { MenuProps } from 'antd'
import { FileExcelOutlined, ProjectOutlined } from '@ant-design/icons'

type AntdMenuItem = Required<MenuProps>['items'][number]

// export type MenuItemTypeCustom = AntdMenuItem & {
//   children?: MenuItemTypeCustom[]
// }

export const getMenuItems = (): AntdMenuItem[] => {
  return [
    {
      key: '/',
      icon: <FileExcelOutlined />,
      label: 'Xuất báo cáo chấm công'
    },
    {
      key: '/management',
      icon: <ProjectOutlined />,
      label: 'Nhân viên và dự án'
    }
  ]
}
