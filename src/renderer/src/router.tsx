import { createHashRouter } from 'react-router'
import ErrorBoundary from './pages/error/ErrorBoundary'
import { RootLayout } from './layouts/RootLayout'

const router = createHashRouter(
  [
    {
      errorElement: <ErrorBoundary />,
      Component: RootLayout,
      children: [
        {
          lazy: () => import('./layouts/default/DefaultLayout'),
          children: [
            {
              index: true,
              lazy: async () => {
                const { Navigate } = await import('react-router')
                return { Component: () => <Navigate to="/attendance" replace /> }
              }
            },
            {
              path: '/attendance',
              lazy: () => import('@renderer/pages/AttendancePage')
            },
            {
              path: '/attendance/projects',
              lazy: () => import('@renderer/pages/ProjectAssignment')
            },
            {
              path: '/attendance/preview',
              lazy: () => import('@renderer/pages/AttendancePreviewPage')
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
