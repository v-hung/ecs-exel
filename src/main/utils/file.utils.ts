import { join } from 'path'
import { app } from 'electron'

export const getFilePath = (filaPath: string): string => {
  if (app.isPackaged) {
    return join(process.resourcesPath, filaPath)
  } else {
    // Trong dev mode, tìm từ project root
    return join(process.cwd(), 'resources', filaPath)
  }
}
