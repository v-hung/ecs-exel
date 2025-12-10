import { useMemo } from 'react'
import { getMenuItems } from '../constants/menu'

export const useMenu = () => {
  const menuItems = useMemo(() => getMenuItems(), [])

  return { menuItems }
}
