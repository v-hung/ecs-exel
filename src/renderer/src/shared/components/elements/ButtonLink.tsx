import { Button } from 'antd'
import { ComponentProps, FC, MouseEvent } from 'react'
import { useNavigate } from 'react-router'

type State = ComponentProps<typeof Button> & {
  href: string
}

const ButtonLink: FC<State> = (props) => {
  const { className, href, onClick, ...rest } = props

  const navigate = useNavigate()

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    navigate(href)

    if (onClick) {
      onClick(e)
    }
  }

  return <Button {...rest} onClick={handleClick} className={`${className}`}></Button>
}

export default ButtonLink
