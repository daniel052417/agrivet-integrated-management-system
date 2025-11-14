/**
 * Get the OAuth redirect URL for authentication callbacks
 * In production, uses the production URL from environment variable
 * In development, uses the current origin
 */
export const getAuthRedirectUrl = (path: string = '/auth/callback'): string => {
  // Check if we have a production URL configured
  const productionUrl = import.meta.env.VITE_PRODUCTION_URL || import.meta.env.VITE_SITE_URL
  
  // In production, use the configured production URL
  if (productionUrl && import.meta.env.PROD) {
    // Ensure the URL doesn't have a trailing slash
    const baseUrl = productionUrl.replace(/\/$/, '')
    // Ensure the path starts with a slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${cleanPath}`
  }
  
  // In development or if no production URL is set, use the current origin
  // This works correctly whether on localhost or production
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${cleanPath}`
}

/**
 * Get the base URL for the application
 * Useful for other redirects or API calls
 */
export const getBaseUrl = (): string => {
  const productionUrl = import.meta.env.VITE_PRODUCTION_URL || import.meta.env.VITE_SITE_URL
  
  if (productionUrl && import.meta.env.PROD) {
    return productionUrl.replace(/\/$/, '')
  }
  
  return typeof window !== 'undefined' ? window.location.origin : ''
}
