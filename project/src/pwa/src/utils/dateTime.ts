type DateInput = string | number | Date | null | undefined

const DEFAULT_LOCALE = 'en-PH'
const DEFAULT_TIME_ZONE = 'Asia/Manila'

const hasTimeZone = (value: string): boolean => /[zZ]|([+-]\d{2}:?\d{2})$/.test(value)

const normaliseToISO = (value: string): string => {
  const trimmed = value.trim()
  const withSeparator = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  if (hasTimeZone(withSeparator)) {
    return withSeparator
  }
  return `${withSeparator}Z`
}

const toDate = (input: DateInput): Date | null => {
  if (input === null || input === undefined) return null
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  if (typeof input === 'number') {
    const numericDate = new Date(input)
    return Number.isNaN(numericDate.getTime()) ? null : numericDate
  }

  const normalised = normaliseToISO(String(input))
  const candidate = new Date(normalised)
  return Number.isNaN(candidate.getTime()) ? null : candidate
}

export const formatManilaDateTime = (
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const date = toDate(input)
  if (!date) return ''

  return date.toLocaleString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIME_ZONE,
    ...options
  })
}

export const formatManilaDate = (
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  return formatManilaDateTime(input, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  })
}

export const formatManilaTime = (
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  return formatManilaDateTime(input, {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  })
}

export const formatManilaRelativeTime = (
  input: DateInput,
  fallbackOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const target = toDate(input)
  if (!target) return ''

  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)
  const diffHours = Math.round(diffMinutes / 60)
  const absHours = Math.abs(diffHours)
  const diffDays = Math.round(diffMinutes / (60 * 24))
  const absDays = Math.abs(diffDays)

  if (absMinutes < 1) return 'Just now'
  if (absMinutes < 60) {
    return diffMinutes >= 0 ? `${absMinutes}m ago` : `in ${absMinutes}m`
  }
  if (absHours < 24) {
    return diffHours >= 0 ? `${absHours}h ago` : `in ${absHours}h`
  }
  if (absDays < 7) {
    return diffDays >= 0 ? `${absDays}d ago` : `in ${absDays}d`
  }

  return formatManilaDateTime(target, fallbackOptions)
}

export const parseManilaDate = (input: DateInput): Date | null => toDate(input)

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
    timeZone: DEFAULT_TIME_ZONE,
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
    timeZone: DEFAULT_TIME_ZONE,
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

