/**
 * Get current timestamp in Manila timezone as ISO string with timezone offset
 * This should be used for all Supabase timestamp insertions to ensure
 * timestamps are stored based on Manila, Philippines timezone (UTC+8)
 * 
 * Returns an ISO string with +08:00 timezone offset so PostgreSQL
 * correctly interprets it as Manila time and stores it appropriately.
 * When queried in Manila timezone, it will display the correct local time.
 */
export const getManilaTimestamp = (): string => {
  const now = new Date()
  
  // Get the current time components in Manila timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')!.value
  const month = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
  const hour = parts.find(p => p.type === 'hour')!.value
  const minute = parts.find(p => p.type === 'minute')!.value
  const second = parts.find(p => p.type === 'second')!.value
  
  // Format as ISO string with +08:00 timezone offset (Manila is UTC+8)
  // Format: YYYY-MM-DDTHH:mm:ss+08:00
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`
}

/**
 * Get Manila timestamp with offset (for future/past dates)
 * @param offsetMs - Offset in milliseconds (positive for future, negative for past)
 * Returns an ISO string with +08:00 timezone offset representing Manila time
 */
export const getManilaTimestampWithOffset = (offsetMs: number): string => {
  const now = new Date()
  // Add offset to current time first
  const targetTime = new Date(now.getTime() + offsetMs)
  
  // Get the target time components in Manila timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(targetTime)
  const year = parts.find(p => p.type === 'year')!.value
  const month = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
  const hour = parts.find(p => p.type === 'hour')!.value
  const minute = parts.find(p => p.type === 'minute')!.value
  const second = parts.find(p => p.type === 'second')!.value
  
  // Format as ISO string with +08:00 timezone offset (Manila is UTC+8)
  // Format: YYYY-MM-DDTHH:mm:ss+08:00
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`
}

