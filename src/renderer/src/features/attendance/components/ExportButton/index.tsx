import { Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

interface ExportButtonProps {
  loading: boolean
  disabled?: boolean
  onClick: () => void
}

// /* eslint-disable react/prop-types */
export const ExportButton: React.FC<ExportButtonProps> = ({
  loading,
  disabled = false,
  onClick
}) => {
  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      size="large"
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      block
    >
      Xuất file Excel
    </Button>
  )
}
