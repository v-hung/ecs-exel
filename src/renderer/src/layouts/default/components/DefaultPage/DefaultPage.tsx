import { Layout } from 'antd'
import { useRef, type FC, type HTMLAttributes } from 'react'
import './DefaultPage.css'

type State = HTMLAttributes<HTMLDivElement> & {
  pageClassName?: string
  showScrollIndicator?: boolean
}

const DefaultPage: FC<State> = (props) => {
  const {
    className = '',
    pageClassName = '',
    showScrollIndicator = true,
    children,
    ...rest
  } = props

  const layoutRef = useRef<HTMLDivElement | null>(null)

  return (
    <Layout {...rest} className={`default-page  ${className}`} ref={layoutRef}>
      <div className={`default-page__container ${pageClassName}`}>{children}</div>
    </Layout>
  )
}

export default DefaultPage
