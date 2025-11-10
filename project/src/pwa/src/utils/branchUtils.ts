import { Branch } from '../types'

/**
 * Get the next opening time for a branch
 * @param branch - The branch object with operating hours
 * @returns The next opening time as a string (e.g., "08:00 AM")
 */
export const getNextOpeningTime = (branch: Branch): string => {
  if (!branch.operating_hours) {
    return '08:00 AM'
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  // Check the next 7 days starting from today
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7
    const dayName = dayNames[checkDay] as keyof typeof branch.operating_hours
    const dayHours = branch.operating_hours[dayName]
    
    // If this day is not closed and has open/close times
    if (dayHours && !('closed' in dayHours) && 'open' in dayHours) {
      const openTime = dayHours.open
      
      // If it's today, check if we're past the opening time
      if (i === 0) {
        const currentTime = now.toLocaleTimeString('en-PH', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Manila'
        })
        
        if (currentTime < openTime) {
          // Branch opens later today
          return formatTime(openTime)
        }
        // Branch already opened today, so next opening is tomorrow
        continue
      }
      
      // This is a future day with opening hours
      return formatTime(openTime)
    }
  }
  
  // Fallback if no opening hours found
  return '08:00 AM'
}

/**
 * Format time string to 12-hour format with AM/PM
 * @param timeString - Time in 24-hour format (e.g., "08:00")
 * @returns Formatted time string (e.g., "8:00 AM")
 */
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Check if a branch is currently closed
 * @param branch - The branch object with operating hours
 * @returns True if the branch is closed, false if open
 */
export const isBranchClosed = (branch: Branch): boolean => {
  if (!branch.operating_hours) {
    return true
  }

  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.toLocaleTimeString('en-PH', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Manila'
  })

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[currentDay] as keyof typeof branch.operating_hours
  const todayHours = branch.operating_hours[todayName]

  // If today is closed
  if (!todayHours || 'closed' in todayHours) {
    return true
  }

  // If today has open/close times, check if we're within them
  if ('open' in todayHours && 'close' in todayHours) {
    return currentTime < todayHours.open || currentTime > todayHours.close
  }

  return true
}




















