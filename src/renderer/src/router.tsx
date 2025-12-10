import { createBrowserRouter } from 'react-router'
import ErrorBoundary from './pages/error/ErrorBoundary'
import { RootLayout } from './layouts/RootLayout'

const router = createBrowserRouter(
  [
    {
      errorElement: <ErrorBoundary />,
      Component: RootLayout,
      children: [
        {
          lazy: () => import('./layouts/default/DefaultLayout'),
          children: [
            {
              path: '/',
              lazy: () => import('@renderer/pages/attendance/AttendancePage')
            },
            {
              path: '/attendance/preview',
              lazy: () => import('@renderer/pages/attendance/AttendancePreviewPage')
            }
          ]
        },
        {
          path: '*',
          lazy: () => import('./pages/error/NotFoundPage')
        }
      ]
    }
  ],
  {
    future: {
      // v7_partialHydration: true,
    }
  }
)

export default router
