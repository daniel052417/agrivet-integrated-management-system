/**
 * Get current timestamp in Manila timezone as ISO string
 * This should be used for all Supabase timestamp insertions to ensure
 * timestamps are stored based on Manila, Philippines timezone (UTC+8)
 * 
 * The function gets the current time components in Manila timezone,
 * then constructs a UTC ISO string that represents that Manila time.
 */
export const getManilaTimestamp = (): string => {
  const now = new Date()
  
  // Get time components in Manila timezone
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
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1
  const day = parseInt(parts.find(p => p.type === 'day')!.value)
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value)
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value)
  const second = parseInt(parts.find(p => p.type === 'second')!.value)
  
  // Create a date object from Manila time components
  // This represents the Manila time as if it were UTC
  const manilaAsUTC = new Date(Date.UTC(year, month, day, hour, minute, second))
  
  // Adjust for Manila's UTC+8 offset to get the correct UTC time
  const manilaOffset = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
  const utcTime = new Date(manilaAsUTC.getTime() - manilaOffset)
  
  return utcTime.toISOString()
}

/**
 * Get Manila timestamp with offset (for future/past dates)
 * @param offsetMs - Offset in milliseconds (positive for future, negative for past)
 */
export const getManilaTimestampWithOffset = (offsetMs: number): string => {
  const now = new Date()
  const targetTime = new Date(now.getTime() + offsetMs)
  
  // Get time components in Manila timezone for the target time
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
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1
  const day = parseInt(parts.find(p => p.type === 'day')!.value)
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value)
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value)
  const second = parseInt(parts.find(p => p.type === 'second')!.value)
  
  const manilaAsUTC = new Date(Date.UTC(year, month, day, hour, minute, second))
  const manilaOffset = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
  const utcTime = new Date(manilaAsUTC.getTime() - manilaOffset)
  
  return utcTime.toISOString()
}

