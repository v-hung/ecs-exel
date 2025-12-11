import { format as dateFnsFormat } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Format date với locale tiếng Việt
 * @param date - Date object hoặc timestamp
 * @param formatStr - Format string (yyyy-MM-dd, dd/MM/yyyy, EEE, etc.)
 * @returns Formatted date string
 */
export function format(date: Date | number, formatStr: string): string {
  return dateFnsFormat(date, formatStr, { locale: vi })
}
