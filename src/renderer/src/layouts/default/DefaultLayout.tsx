import { Layout } from 'antd'
import { Outlet } from 'react-router'
import { LayoutProvider } from './contexts/LayoutContext'
import DefaultMenu from './components/DefaultMenu/DefaultMenu'
import './DefaultLayout.css'
import ProgressIndicator from '@renderer/shared/components/navigation/ProgressIndicator/ProgressIndicator'

export const Component = () => {
  return (
    <LayoutProvider>
      <Layout className="layout--default">
        <DefaultMenu />
        <Outlet />
      </Layout>
      <ProgressIndicator />
    </LayoutProvider>
  )
}
