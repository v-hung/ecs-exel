import { ConfigProvider, App as AppTheme } from 'antd'
import { Outlet } from 'react-router'

export const RootLayout = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0284c7',
          colorTextBase: '#222',
          colorBgLayout: '#f8fafd'
        }
      }}
    >
      <AppTheme
        message={{ maxCount: 1 }}
        notification={{
          placement: 'topRight',
          pauseOnHover: true,
          // showProgress: true,
          duration: 2
        }}
      >
        <Outlet />
      </AppTheme>
    </ConfigProvider>
  )
}
