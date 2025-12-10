import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface LayoutContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

const STORAGE_KEY = 'menu-collapsed'

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : true
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed))
  }, [collapsed])

  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed }}>{children}</LayoutContext.Provider>
  )
}

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return context
}
