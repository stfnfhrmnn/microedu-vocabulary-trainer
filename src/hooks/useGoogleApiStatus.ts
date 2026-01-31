'use client'

import { useState, useEffect } from 'react'

interface GoogleApiStatus {
  available: boolean
  loading: boolean
  error: string | null
}

/**
 * Hook to check if Google API is configured on the server
 * Caches the result to avoid repeated API calls
 */
let cachedStatus: boolean | null = null
let cachePromise: Promise<boolean> | null = null

async function fetchStatus(): Promise<boolean> {
  if (cachedStatus !== null) {
    return cachedStatus
  }

  if (cachePromise) {
    return cachePromise
  }

  cachePromise = fetch('/api/google/status')
    .then((res) => res.json())
    .then((data) => {
      cachedStatus = data.available ?? false
      return cachedStatus as boolean
    })
    .catch(() => {
      cachedStatus = false
      return false
    })

  return cachePromise
}

export function useGoogleApiStatus(): GoogleApiStatus {
  const [status, setStatus] = useState<GoogleApiStatus>({
    available: cachedStatus === null ? false : cachedStatus,
    loading: cachedStatus === null,
    error: null,
  })

  useEffect(() => {
    if (cachedStatus !== null) {
      setStatus({ available: cachedStatus, loading: false, error: null })
      return
    }

    fetchStatus()
      .then((available) => {
        setStatus({ available, loading: false, error: null })
      })
      .catch((error) => {
        setStatus({
          available: false,
          loading: false,
          error: error.message || 'Failed to check Google API status',
        })
      })
  }, [])

  return status
}

/**
 * Synchronous check if Google API is available (uses cached value)
 * Returns false if not yet checked
 */
export function isGoogleApiAvailable(): boolean {
  return cachedStatus ?? false
}

/**
 * Pre-fetch the Google API status (call early in app lifecycle)
 */
export function prefetchGoogleApiStatus(): Promise<boolean> {
  return fetchStatus()
}
