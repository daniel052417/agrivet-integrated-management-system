/**
 * Utility functions for parsing and using work_schedule data
 * Format: "Mon, Tue, Wed, Thu, Fri • 07:00 - 19:00"
 */

export interface ParsedWorkSchedule {
  workDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  startTime: string; // '07:00'
  endTime: string; // '19:00'
  startHour: number; // 7
  startMinute: number; // 0
}

/**
 * Parse work_schedule string into structured data
 * @param workSchedule - Format: "Mon, Tue, Wed, Thu, Fri • 07:00 - 19:00"
 * @returns Parsed work schedule or null if invalid
 */
export function parseWorkSchedule(workSchedule: string | null | undefined): ParsedWorkSchedule | null {
  if (!workSchedule || !workSchedule.trim()) {
    return null;
  }

  try {
    // Split by bullet point (•) to separate days and time
    const parts = workSchedule.split('•');
    if (parts.length !== 2) {
      return null;
    }

    // Parse work days
    const daysPart = parts[0].trim();
    const workDays = daysPart.split(',').map(d => d.trim()).filter(Boolean);

    // Parse time range
    const timePart = parts[1].trim();
    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
      return null;
    }

    const startHour = parseInt(timeMatch[1], 10);
    const startMinute = parseInt(timeMatch[2], 10);
    const endHour = parseInt(timeMatch[3], 10);
    const endMinute = parseInt(timeMatch[4], 10);

    return {
      workDays,
      startTime: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
      endTime: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
      startHour,
      startMinute,
    };
  } catch (error) {
    console.error('Error parsing work schedule:', error);
    return null;
  }
}

/**
 * Check if a given date is a work day based on work schedule
 * @param date - Date to check
 * @param workSchedule - Parsed work schedule
 * @returns true if the date is a work day
 */
export function isWorkDay(date: Date, workSchedule: ParsedWorkSchedule | null): boolean {
  if (!workSchedule || workSchedule.workDays.length === 0) {
    // Default to weekdays if no schedule
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = date.getDay();
  const dayName = dayNames[dayOfWeek];

  return workSchedule.workDays.includes(dayName);
}

/**
 * Get the expected start time for a given date based on work schedule
 * @param date - Date to get expected start time for
 * @param workSchedule - Parsed work schedule
 * @returns Date object with expected start time, or null if not a work day
 */
export function getExpectedStartTime(date: Date, workSchedule: ParsedWorkSchedule | null): Date | null {
  if (!workSchedule) {
    // Default to 8:00 AM if no schedule
    const expected = new Date(date);
    expected.setHours(8, 0, 0, 0);
    return expected;
  }

  if (!isWorkDay(date, workSchedule)) {
    return null; // Not a work day
  }

  const expected = new Date(date);
  expected.setHours(workSchedule.startHour, workSchedule.startMinute, 0, 0);
  return expected;
}

/**
 * Calculate late minutes based on actual time_in and work schedule
 * @param timeIn - Actual time in (Date or ISO string)
 * @param workSchedule - Parsed work schedule
 * @param thresholdMinutes - Late threshold in minutes (default: 15)
 * @returns Object with isLate flag and lateMinutes count
 */
export function calculateLateStatus(
  timeIn: Date | string,
  workSchedule: ParsedWorkSchedule | null,
  thresholdMinutes: number = 15
): { isLate: boolean; lateMinutes: number } {
  const actualTime = typeof timeIn === 'string' ? new Date(timeIn) : timeIn;
  const attendanceDate = new Date(actualTime);
  attendanceDate.setHours(0, 0, 0, 0);

  const expectedStartTime = getExpectedStartTime(attendanceDate, workSchedule);
  
  if (!expectedStartTime) {
    // Not a work day, so not late
    return { isLate: false, lateMinutes: 0 };
  }

  const minutesDiff = Math.floor((actualTime.getTime() - expectedStartTime.getTime()) / 60000);
  
  if (minutesDiff > thresholdMinutes) {
    return {
      isLate: true,
      lateMinutes: minutesDiff
    };
  }

  return { isLate: false, lateMinutes: 0 };
}

/**
 * Get work days count in a date range based on work schedule
 * @param startDate - Start date
 * @param endDate - End date
 * @param workSchedule - Parsed work schedule
 * @returns Number of work days
 */
export function getWorkDaysCount(
  startDate: Date,
  endDate: Date,
  workSchedule: ParsedWorkSchedule | null
): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkDay(current, workSchedule)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

