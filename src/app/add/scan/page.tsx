'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { CameraCapture } from '@/components/ocr/CameraCapture'
import { OCRReview } from '@/components/ocr/OCRReview'
import { OCRProgress, ProviderBadge } from '@/components/ocr/OCRProgress'
import { Button } from '@/components/ui/Button'
import { useOCR } from '@/hooks/useOCR'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { createVocabularyItems } from '@/lib/db/db'
import type { VocabularyCandidate, ExtractionHints } from '@/lib/ocr/types'

type ScanStep = 'capture' | 'processing' | 'review' | 'success'

export default function ScanPage() {
  const router = useRouter()
  const [step, setStep] = useState<ScanStep>('capture')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null)

  const { sections, isLoading: sectionsLoading } = useAllSections()
  const {
    isProcessing,
    candidates,
    error,
    activeProvider,
    processImage,
    clearCandidates,
    updateCandidate,
    removeCandidate,
    addCandidate,
  } = useOCR()

  // Convert sections to select options with book/chapter context
  const sectionOptions = useMemo(() => {
    return sections.map((s) => ({
      value: s.id,
      label: `${s.book?.name || 'Unbekannt'} / ${s.chapter?.name || 'Unbekannt'} / ${s.name}`,
    }))
  }, [sections])

  // Find selected section for hints
  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  const handleCapture = useCallback(
    async (image: Blob) => {
      setCapturedImage(image)
      setStep('processing')

      // Build hints from selected section
      const hints: ExtractionHints = {}
      if (selectedSection?.book) {
        hints.targetLanguage = selectedSection.book.language
        hints.sourceLanguage = 'german'
      }

      await processImage(image, hints)
      setStep('review')
    },
    [processImage, selectedSection]
  )

  const handleFileSelect = useCallback(
    (file: File) => {
      handleCapture(file)
    },
    [handleCapture]
  )

  const handleAddCandidate = useCallback(() => {
    addCandidate({
      sourceText: '',
      targetText: '',
      confidence: 1.0,
    })
  }, [addCandidate])

  const handleSave = useCallback(async () => {
    if (!selectedSectionId) return

    const section = sections.find((s) => s.id === selectedSectionId)
    if (!section) return

    // Filter valid candidates
    const validCandidates = candidates.filter(
      (c) => c.sourceText.trim() && c.targetText.trim()
    )

    if (validCandidates.length === 0) return

    setIsSaving(true)

    try {
      // Create vocabulary items
      await createVocabularyItems(
        validCandidates.map((c) => ({
          sourceText: c.sourceText.trim(),
          targetText: c.targetText.trim(),
          notes: c.notes?.trim(),
          sectionId: section.id,
          chapterId: section.chapterId,
          bookId: section.bookId,
        }))
      )

      setSavedCount(validCandidates.length)
      setStep('success')
    } catch (err) {
      console.error('Failed to save vocabulary:', err)
    } finally {
      setIsSaving(false)
    }
  }, [candidates, selectedSectionId, sections])

  const handleCancel = useCallback(() => {
    clearCandidates()
    setCapturedImage(null)
    setStep('capture')
  }, [clearCandidates])

  const handleScanAnother = useCallback(() => {
    clearCandidates()
    setCapturedImage(null)
    setSavedCount(0)
    setStep('capture')
  }, [clearCandidates])

  // No sections available
  if (!sectionsLoading && sections.length === 0) {
    return (
      <PageContainer>
        <Header title="Vokabeln scannen" showBack />

        <div className="p-4">
          <div className="bg-warning-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-warning-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-warning-800 mb-2">
              Keine Abschnitte vorhanden
            </h3>
            <p className="text-warning-700 mb-4">
              Erstelle zuerst ein Buch mit Kapiteln und Abschnitten, um Vokabeln
              scannen zu können.
            </p>
            <Button variant="primary" onClick={() => router.push('/library')}>
              Zur Bibliothek
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer noPadding>
      <AnimatePresence mode="wait">
        {/* Capture Step */}
        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[100dvh]"
          >
            <Header title="Vokabeln scannen" showBack />

            {/* Section pre-selection */}
            {sectionOptions.length > 0 && (
              <div className="px-4 py-3 bg-white border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ziel-Abschnitt (optional)
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full text-base text-gray-900 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 appearance-none"
                >
                  <option value="">Später auswählen</option>
                  {sectionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1">
              <CameraCapture onCapture={handleCapture} onFileSelect={handleFileSelect} />
            </div>

            {/* Tip */}
            <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
              Tipp: Fotografiere eine Vokabelliste mit klarem Text. Achte auf gute
              Beleuchtung.
            </div>
          </motion.div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[100dvh]"
          >
            <Header title="Verarbeite..." />

            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {/* Preview of captured image */}
              {capturedImage && (
                <div className="w-48 h-48 rounded-xl overflow-hidden mb-6 shadow-lg">
                  <img
                    src={URL.createObjectURL(capturedImage)}
                    alt="Erfasstes Bild"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Progress indicator */}
              <OCRProgress
                stage="processing"
                provider={activeProvider || 'tesseract'}
              />

              {isProcessing && (
                <p className="text-gray-400 text-xs mt-4">
                  Dies kann einen Moment dauern...
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[100dvh]"
          >
            <Header
              title="Überprüfen"
              action={
                activeProvider && (
                  <ProviderBadge provider={activeProvider} />
                )
              }
            />

            {/* Error banner */}
            {error && (
              <div className="px-4 py-3 bg-error-50 border-b border-error-200">
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <OCRReview
                candidates={candidates}
                sections={sectionOptions}
                selectedSectionId={selectedSectionId}
                targetLanguage={selectedSection?.book?.language}
                onSectionChange={setSelectedSectionId}
                onUpdateCandidate={updateCandidate}
                onRemoveCandidate={removeCandidate}
                onAddCandidate={handleAddCandidate}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            </div>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[100dvh]"
          >
            <Header title="Gespeichert" />

            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mb-6"
              >
                <svg
                  className="w-12 h-12 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {savedCount} Vokabeln gespeichert!
              </h3>

              <p className="text-gray-500 text-center mb-8">
                Die Vokabeln wurden erfolgreich in deinem Abschnitt gespeichert und
                können jetzt geübt werden.
              </p>

              <div className="space-y-3 w-full max-w-xs">
                <Button variant="primary" fullWidth onClick={handleScanAnother}>
                  Weitere scannen
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push('/practice')}
                >
                  Jetzt üben
                </Button>
                <Button variant="ghost" fullWidth onClick={() => router.push('/library')}>
                  Zur Bibliothek
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
