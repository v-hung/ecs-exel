import { Outlet } from 'react-router'
import './DefaultLayout.css'
import ProgressIndicator from '@renderer/shared/components/navigation/ProgressIndicator/ProgressIndicator'
import { AttendanceSessionProvider } from '@renderer/contexts/AttendanceSessionContext'

export const Component = () => {
  return (
    <AttendanceSessionProvider>
      <Outlet />
      <ProgressIndicator />
    </AttendanceSessionProvider>
  )
  // return (
  //   <LayoutProvider>
  //     <Layout className="layout--default">
  //       <DefaultMenu />
  //       <Outlet />
  //     </Layout>
  //     <ProgressIndicator />
  //   </LayoutProvider>
  // )
}
