import { Flex, Form, Transfer, Spin } from 'antd'
import type { TransferProps } from 'antd'
import { Key, useMemo } from 'react'
import './style.css'
import { UserDto } from '../../hooks/users'

interface EmployeeTransferProps {
  dataSource: UserDto[]
  targetKeys: Key[]
  onChange: TransferProps['onChange']
  loading?: boolean
}

export const EmployeeTransfer: React.FC<EmployeeTransferProps> = ({
  dataSource,
  targetKeys,
  onChange,
  loading
}) => {
  const dataSourceWithKeys = useMemo(
    () =>
      dataSource.map((item) => ({
        ...item,
        key: item.id
      })),
    [dataSource]
  )

  return (
    <Form.Item
      label="Chọn nhân viên"
      style={{ flex: '1', display: 'flex', flexDirection: 'column', height: 0 }}
      className="form-item-full-height"
    >
      <Spin spinning={loading} tip="Đang tải danh sách nhân viên...">
        <Transfer
          dataSource={dataSourceWithKeys}
          titles={['Danh sách nhân viên', 'Nhân viên đã chọn']}
          targetKeys={targetKeys}
          onChange={onChange}
          render={(item) => `${item.name} - ${item.username}`}
          styles={{
            section: {
              width: '100%',
              maxHeight: '100%',
              minHeight: '100%'
            },
            root: { height: '100%' }
          }}
          showSearch
          filterOption={(inputValue, item) =>
            item.name.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
            item.username.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
          }
        />
      </Spin>
    </Form.Item>
  )
}
