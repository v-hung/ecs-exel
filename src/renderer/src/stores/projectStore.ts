import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Project {
  id: number
  name: string
  employeeIds: number[]
}

interface ProjectStore {
  projects: Project[]
  initializeProjects: () => void
  updateProjectName: (projectId: number, name: string) => void
  addEmployeeToProject: (projectId: number, employeeId: number) => void
  removeEmployeeFromProject: (projectId: number, employeeId: number) => void
  setProjectEmployees: (projectId: number, employeeIds: number[]) => void
  addNewProject: (name: string) => void
  deleteProject: (projectId: number) => void
}

const DEFAULT_PROJECTS: Project[] = [
  { id: 1, name: 'Dự án #1', employeeIds: [] },
  { id: 2, name: 'Dự án #2', employeeIds: [] },
  { id: 3, name: 'Dự án #3', employeeIds: [] },
  { id: 4, name: 'Dự án #4', employeeIds: [] },
  { id: 5, name: 'Dự án #5', employeeIds: [] }
]

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: DEFAULT_PROJECTS,

      initializeProjects: () => {
        const currentProjects = get().projects
        if (currentProjects.length < 5) {
          const projectsToAdd = 5 - currentProjects.length
          const newProjects: Project[] = []
          for (let i = 0; i < projectsToAdd; i++) {
            newProjects.push({
              id: i + 1,
              name: `Dự án #${currentProjects.length + i + 1}`,
              employeeIds: []
            })
          }
          set({ projects: [...currentProjects, ...newProjects] })
        }
      },

      updateProjectName: (projectId, name) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, name } : project
          )
        }))
      },

      addEmployeeToProject: (projectId, employeeId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  employeeIds: project.employeeIds.includes(employeeId)
                    ? project.employeeIds
                    : [...project.employeeIds, employeeId]
                }
              : project
          )
        }))
      },

      removeEmployeeFromProject: (projectId, employeeId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  employeeIds: project.employeeIds.filter((id) => id !== employeeId)
                }
              : project
          )
        }))
      },

      setProjectEmployees: (projectId, employeeIds) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, employeeIds } : project
          )
        }))
      },

      addNewProject: (name) => {
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: state.projects.length > 0 ? Math.max(...state.projects.map((p) => p.id)) + 1 : 1,
              name: name || `Dự án #${state.projects.length + 1}`,
              employeeIds: []
            }
          ]
        }))
      },

      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId)
        }))
      }
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
