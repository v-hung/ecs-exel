import { join } from 'path'
import { app } from 'electron'

export const getFilePath = (filaPath: string): string => {
  if (app.isPackaged) {
    return join(process.resourcesPath, filaPath)
  } else {
    return join(__dirname, '../../../resources/', filaPath)
  }
}
