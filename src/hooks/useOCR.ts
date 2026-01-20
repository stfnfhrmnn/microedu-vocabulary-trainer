'use client'

import { useState, useCallback, useEffect } from 'react'
import { ocrService } from '@/lib/ocr/ocr-service'
import type { VocabularyCandidate, ExtractionHints, OCRProviderType } from '@/lib/ocr/types'

interface UseOCRResult {
  isProcessing: boolean
  candidates: VocabularyCandidate[]
  error: string | null
  activeProvider: OCRProviderType | null
  processImage: (image: Blob, hints?: ExtractionHints) => Promise<void>
  clearCandidates: () => void
  updateCandidate: (index: number, updates: Partial<VocabularyCandidate>) => void
  removeCandidate: (index: number) => void
  addCandidate: (candidate: VocabularyCandidate) => void
}

/**
 * Hook for OCR processing and vocabulary extraction
 */
export function useOCR(): UseOCRResult {
  const [isProcessing, setIsProcessing] = useState(false)
  const [candidates, setCandidates] = useState<VocabularyCandidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeProvider, setActiveProvider] = useState<OCRProviderType | null>(null)

  // Get active provider on mount
  useEffect(() => {
    ocrService.getActiveProviderType().then(setActiveProvider)
  }, [])

  const processImage = useCallback(async (image: Blob, hints?: ExtractionHints) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Update active provider
      const provider = await ocrService.getActiveProviderType()
      setActiveProvider(provider)

      // Extract vocabulary
      const extracted = await ocrService.extractVocabulary(image, hints)

      if (extracted.length === 0) {
        setError('Keine Vokabeln erkannt. Versuche es mit einem klareren Bild.')
      }

      setCandidates(extracted)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR-Verarbeitung fehlgeschlagen'
      setError(message)
      setCandidates([])
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearCandidates = useCallback(() => {
    setCandidates([])
    setError(null)
  }, [])

  const updateCandidate = useCallback((index: number, updates: Partial<VocabularyCandidate>) => {
    setCandidates((prev) =>
      prev.map((candidate, i) =>
        i === index ? { ...candidate, ...updates } : candidate
      )
    )
  }, [])

  const removeCandidate = useCallback((index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addCandidate = useCallback((candidate: VocabularyCandidate) => {
    setCandidates((prev) => [...prev, candidate])
  }, [])

  return {
    isProcessing,
    candidates,
    error,
    activeProvider,
    processImage,
    clearCandidates,
    updateCandidate,
    removeCandidate,
    addCandidate,
  }
}
