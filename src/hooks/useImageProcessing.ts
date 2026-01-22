'use client'

import { useState, useCallback } from 'react'
import {
  processImage,
  getImageDimensions,
  type ProcessedImage,
  type ProcessImageOptions,
} from '@/lib/services/image-processing'

interface UseImageProcessingResult {
  process: (source: Blob | File, options?: ProcessImageOptions) => Promise<ProcessedImage>
  isProcessing: boolean
  progress: ProcessingProgress | null
  error: string | null
}

interface ProcessingProgress {
  stage: 'loading' | 'cropping' | 'resizing' | 'converting'
  percent: number
}

export function useImageProcessing(): UseImageProcessingResult {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const process = useCallback(
    async (source: Blob | File, options?: ProcessImageOptions): Promise<ProcessedImage> => {
      setIsProcessing(true)
      setError(null)
      setProgress({ stage: 'loading', percent: 10 })

      try {
        // Get dimensions first
        setProgress({ stage: 'loading', percent: 20 })
        const dimensions = await getImageDimensions(source)

        setProgress({ stage: 'cropping', percent: 40 })

        // Process the image
        setProgress({ stage: 'resizing', percent: 60 })
        setProgress({ stage: 'converting', percent: 80 })

        const result = await processImage(source, options)

        setProgress({ stage: 'converting', percent: 100 })

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Image processing failed'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
        setProgress(null)
      }
    },
    []
  )

  return {
    process,
    isProcessing,
    progress,
    error,
  }
}

/**
 * Hook for batch image processing
 */
export function useBatchImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const processBatch = useCallback(
    async (
      sources: (Blob | File)[],
      options?: ProcessImageOptions
    ): Promise<ProcessedImage[]> => {
      setIsProcessing(true)
      setError(null)
      setProcessedCount(0)
      setTotalCount(sources.length)

      const results: ProcessedImage[] = []

      try {
        for (let i = 0; i < sources.length; i++) {
          const result = await processImage(sources[i], options)
          results.push(result)
          setProcessedCount(i + 1)
        }

        return results
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Batch processing failed'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  return {
    processBatch,
    isProcessing,
    processedCount,
    totalCount,
    progress: totalCount > 0 ? processedCount / totalCount : 0,
    error,
  }
}
