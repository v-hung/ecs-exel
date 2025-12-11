/**
 * Parse time string "HH:mm:ss" hoặc "HH:mm" thành phút
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Làm tròn phút xuống bội số của 15 phút (0.25h)
 * VD: 7.22h (7h13m) → 7.15h (7h15m)
 *     7.5h (7h30m) → 7.5h (7h30m)
 *     7.88h (7h53m) → 7.75h (7h45m)
 * Max: 8h
 */
function roundDownToQuarterHour(minutes: number): number {
  const MAX_WORK_MINUTES = 8 * 60 // 8h = 480 phút

  // Giới hạn max 8h
  const cappedMinutes = Math.min(minutes, MAX_WORK_MINUTES)

  // Làm tròn xuống bội số của 15 phút
  const roundedMinutes = Math.floor(cappedMinutes / 15) * 15

  return roundedMinutes
}

/**
 * Tính duration thực tế từ startHour và endHour
 */
export function calculateDuration(startHour: string | null, endHour: string | null): number {
  if (!startHour || !endHour) {
    return 0
  }

  const startMinutes = parseTimeToMinutes(startHour)
  let endMinutes = parseTimeToMinutes(endHour)

  // Xử lý trường hợp qua 12h đêm
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  return endMinutes - startMinutes
}

/**
 * Kiểm tra xem khoảng thời gian ticket có giao với khoảng thời gian làm việc không
 * Chỉ tính phần giao nhau
 */
function calculateOverlapMinutes(
  ticketStart: number,
  ticketEnd: number,
  workStart: number,
  workEnd: number
): number {
  const overlapStart = Math.max(ticketStart, workStart)
  const overlapEnd = Math.min(ticketEnd, workEnd)

  if (overlapStart >= overlapEnd) {
    return 0 // Không có phần giao
  }

  return overlapEnd - overlapStart
}

/**
 * Tính thời gian làm việc thực tế
 * Logic đơn giản:
 * 1. Giờ vào tính công: Từ 8h (dù đến sớm hơn cũng chỉ tính từ 8h)
 * 2. Giờ ra tính công: Tối đa 18h hoặc 18h30 (tùy timesheetType)
 * 3. Tổng = (giờ ra - giờ vào) - nghỉ trưa (phần giao)
 * 4. BỎ QUA TICKET - Chỉ tính theo giờ chấm công thực tế
 *
 * VD 1: Vào 10h20, ra 17h55 → (17h55 - 10h20) - nghỉ trưa = 6h05m
 * VD 2: Vào 8h, ra 18h30 → (18h30 - 8h) - nghỉ trưa = 9h
 * VD 3: Vào 14h, ra 18h → (18h - 14h) - 0 (không giao trưa) = 4h
 */
export function calculateWorkDuration(
  startHour: string | null,
  endHour: string | null,
  timesheetType: number
): number {
  if (!startHour || !endHour) {
    return 0
  }

  // Giờ vào thực tế
  const actualStartMinutes = parseTimeToMinutes(startHour)

  // Giờ vào tính công: Từ 8h trở đi (nếu đến trước 8h thì tính từ 8h)
  const WORK_START_TIME = 8 * 60 // 8h = 480 phút
  const workStart = Math.max(actualStartMinutes, WORK_START_TIME)

  // Nghỉ trưa mặc định: 1h30 (90 phút) hoặc 1h (60 phút)
  const DEFAULT_LUNCH_BREAK = 90 // 1h30 phút
  const lunchBreak = Math.max(0, DEFAULT_LUNCH_BREAK - timesheetType)

  // Giờ ra tính công:
  // - Nếu nghỉ trưa 1h30 (timesheetType=0) → tính đến 18h30 (6h30 chiều)
  // - Nếu nghỉ trưa 1h (timesheetType=30) → tính đến 18h (6h chiều)
  const WORK_END_BASE = 18 * 60 // 6h chiều = 18h = 1080 phút
  const WORK_END_TIME = WORK_END_BASE + (lunchBreak - 60) // 18h + (90-60=30phút) = 18h30 hoặc 18h + (60-60=0) = 18h

  const actualEndMinutes = parseTimeToMinutes(endHour)
  let workEnd = Math.min(actualEndMinutes, WORK_END_TIME)

  // Xử lý trường hợp qua 12h đêm
  if (workEnd < workStart) {
    workEnd += 24 * 60
  }

  // Tổng thời gian từ giờ vào đến giờ ra
  const totalMinutes = workEnd - workStart

  // Tính khoảng thời gian nghỉ trưa (giả sử nghỉ từ 12h đến 12h + lunchBreak)
  // Giờ bắt đầu nghỉ trưa: 12h = 720 phút
  const lunchStart = 12 * 60 // 12h
  const lunchEnd = lunchStart + lunchBreak

  // Tính phần giờ làm việc giao với giờ nghỉ trưa
  // Chỉ trừ phần giao nhau, không trừ hết 1h30 nếu vào sau giờ trưa
  const actualLunchBreak = calculateOverlapMinutes(workStart, workEnd, lunchStart, lunchEnd)

  // Thời gian làm việc = Tổng - Nghỉ trưa (phần giao)
  // BỎ QUA TICKET
  const workMinutes = Math.max(0, totalMinutes - actualLunchBreak)

  // Làm tròn xuống bội số của 15 phút (0.25h) và giới hạn max 8h
  const roundedMinutes = roundDownToQuarterHour(workMinutes)

  return roundedMinutes
}
