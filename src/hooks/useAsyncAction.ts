'use client'

import { useState, useCallback } from 'react'
import { toast } from '@/stores/toast'

interface UseAsyncActionOptions {
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Hook for handling async actions with automatic loading state and toast notifications
 */
export function useAsyncAction<T extends (...args: unknown[]) => Promise<unknown>>(
  action: T,
  options: UseAsyncActionOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await action(...args)
        if (options.successMessage) {
          toast.success(options.successMessage)
        }
        options.onSuccess?.()
        return result as ReturnType<T>
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        toast.error(options.errorMessage || error.message || 'Ein Fehler ist aufgetreten')
        options.onError?.(error)
        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    [action, options]
  )

  return { execute, isLoading, error }
}
