import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Key } from 'react'

interface AttendanceStore {
  selectedEmployeeIds: Key[]
  setSelectedEmployeeIds: (ids: Key[]) => void
  clearSelectedEmployeeIds: () => void
}

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set) => ({
      selectedEmployeeIds: [],
      setSelectedEmployeeIds: (ids) => set({ selectedEmployeeIds: ids }),
      clearSelectedEmployeeIds: () => set({ selectedEmployeeIds: [] })
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
