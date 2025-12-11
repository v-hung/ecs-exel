import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AttendanceStore {
  selectedEmployeeIds: number[]
  setSelectedEmployeeIds: (ids: number[]) => void
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
