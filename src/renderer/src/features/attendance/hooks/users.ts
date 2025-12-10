import { useState, useEffect } from 'react'
import { ApiResponse } from 'src/main/types/response.type'
import { UserDto } from 'src/main/types/user.type'

/**
 * Hook to fetch all users
 */
export const useUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result: ApiResponse<UserDto[]> = await window.electron.ipcRenderer.invoke('user:getAll')
      if (result.success) {
        setUsers(result.data)
      } else {
        setError(result.error || 'Lỗi không xác định')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  }
}

/**
 * Hook to fetch user by ID
 */
export const useUser = (id: number) => {
  const [user, setUser] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const result = await window.electron.ipcRenderer.invoke('user:getById', id)
      setUser(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  }
}

/**
 * Hook for user mutations (create, update, delete)
 */
export const useUserMutations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = async (userData: Omit<UserDto, 'id'>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await window.electron.ipcRenderer.invoke('user:create', userData)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: number, userData: Partial<UserDto>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await window.electron.ipcRenderer.invoke('user:update', id, userData)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const result = await window.electron.ipcRenderer.invoke('user:delete', id)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (searchTerm: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await window.electron.ipcRenderer.invoke('user:search', searchTerm)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search users'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    loading,
    error
  }
}
