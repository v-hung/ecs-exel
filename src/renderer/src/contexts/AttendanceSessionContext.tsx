import { createContext, useContext, useState, ReactNode } from 'react'

interface AttendanceSessionContextType {
  startDate: string | null
  endDate: string | null
  step: 'selection' | 'projects' | 'preview'
  setDateRange: (startDate: string, endDate: string) => void
  setStep: (step: 'selection' | 'projects' | 'preview') => void
  resetSession: () => void
}

const AttendanceSessionContext = createContext<AttendanceSessionContextType | undefined>(undefined)

export const AttendanceSessionProvider = ({ children }: { children: ReactNode }) => {
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [step, setStep] = useState<'selection' | 'projects' | 'preview'>('selection')

  const setDateRange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }

  const resetSession = () => {
    setStartDate(null)
    setEndDate(null)
    setStep('selection')
  }

  return (
    <AttendanceSessionContext.Provider
      value={{
        startDate,
        endDate,
        step,
        setDateRange,
        setStep,
        resetSession
      }}
    >
      {children}
    </AttendanceSessionContext.Provider>
  )
}

export const useAttendanceSession = () => {
  const context = useContext(AttendanceSessionContext)
  if (!context) {
    throw new Error('useAttendanceSession must be used within AttendanceSessionProvider')
  }
  return context
}
