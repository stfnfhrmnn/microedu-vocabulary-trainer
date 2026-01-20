'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to track online/offline status
 * @returns { isOnline: boolean } - Current network status
 */
export function useOnline() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state from navigator
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}
