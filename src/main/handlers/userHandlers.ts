import { ipcMain } from 'electron'
import * as userService from '../services/user.service'
import { UserDto } from '../types/user.type'
import { ApiResponse } from '../types/response.type'

export function registerUserHandlers() {
  /**
   * Get all users (not deleted)
   */
  ipcMain.handle('user:getAll', async (): Promise<ApiResponse<UserDto[]>> => {
    try {
      const data = await userService.getUsers()
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Error getting users:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })
}
