import { Layout, Menu, Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { ComponentProps, FC, useMemo } from 'react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { useNavigate, useLocation } from 'react-router'
import { useLayout } from '../../contexts/LayoutContext'
import { useMenu } from '../../hooks/useMenu'
import './DefaultMenu.css'
import { getOpenKeys, getSelectedKeys } from '@renderer/utils/menu.utils'
import './DefaultMenu.css'

const { Sider } = Layout

type State = ComponentProps<typeof Sider>

const DefaultMenu: FC<State> = (props) => {
  const { className = '', ...rest } = props

  const navigate = useNavigate()
  const location = useLocation()

  const { collapsed, setCollapsed } = useLayout()

  const { menuItems } = useMenu()

  const handleMenuItemClick = (info: any) => {
    navigate(info.key)
  }

  const selectedKeys = useMemo(() => getSelectedKeys(location.pathname), [location.pathname])
  const openKeys = useMemo(
    () => getOpenKeys(location.pathname, menuItems),
    [location.pathname, menuItems]
  )

  return (
    <Sider
      theme="light"
      trigger={null}
      collapsible
      collapsed={collapsed}
      {...rest}
      width={256}
      className={`${className} default-menu`}
    >
      <SimpleBar style={{ height: '100%', paddingRight: 4 }}>
        <div className="menu__toggle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: '100%',
              display: 'flex',
              height: 40,
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              paddingLeft: collapsed ? 0 : 24
            }}
          >
            {!collapsed && <span style={{ marginLeft: 8 }}>Export tools</span>}
          </Button>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuItemClick}
        />
      </SimpleBar>
    </Sider>
  )
}

export default DefaultMenu
