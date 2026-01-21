'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function SpaRedirectHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Only process once per mount
    if (hasProcessed.current) return
    hasProcessed.current = true

    const redirectPath = sessionStorage.getItem('spa-redirect-path')

    if (redirectPath && redirectPath !== '/') {
      // Always clear the stored path first to prevent loops
      sessionStorage.removeItem('spa-redirect-path')

      // Check if we're already on the target path (prevents infinite loop)
      if (pathname === redirectPath) {
        return
      }

      // Check for loop detection - if we've tried this path recently, don't redirect
      const lastAttempt = sessionStorage.getItem('spa-redirect-last-attempt')
      const now = Date.now()

      if (lastAttempt) {
        const { path, timestamp } = JSON.parse(lastAttempt)
        // If same path attempted within 5 seconds, it's likely a loop
        if (path === redirectPath && now - timestamp < 5000) {
          sessionStorage.removeItem('spa-redirect-last-attempt')
          return
        }
      }

      // Store this attempt for loop detection
      sessionStorage.setItem('spa-redirect-last-attempt', JSON.stringify({
        path: redirectPath,
        timestamp: now
      }))

      router.replace(redirectPath)
    }
  }, [router, pathname])

  return null
}
