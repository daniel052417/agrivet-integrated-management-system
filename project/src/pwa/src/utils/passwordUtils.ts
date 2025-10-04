// Simple password hashing utility
// Note: In production, use a proper library like bcrypt or argon2

export const hashPassword = async (password: string): Promise<string> => {
  // This is a simple implementation for demo purposes
  // In production, use a proper hashing library like bcrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'agrivet_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === hash
}

// Alternative: Use a proper hashing library
// Install: npm install bcryptjs @types/bcryptjs
// Then uncomment and use this instead:

/*
import bcrypt from 'bcryptjs'

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}
*/


