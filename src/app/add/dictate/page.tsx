'use client'

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { VoiceDictationView } from '@/components/dictation/VoiceDictationView'
import { LegacyOCRReview as OCRReview } from '@/components/ocr/OCRReview'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useAllSections, useBooks } from '@/lib/db/hooks/useBooks'
import { createVocabularyItems } from '@/lib/db/db'
import { refineTranscriptWithGemini } from '@/lib/services/voice-dictation-parser'
import { useSettings } from '@/stores/settings'
import { isSpeechRecognitionAvailable } from '@/lib/services/speech-recognition'
import type { Language } from '@/lib/db/schema'
import type { VocabularyCandidate } from '@/lib/ocr/types'
import type { DictationOrder } from '@/lib/services/voice-dictation-parser'

type DictationStep = 'setup' | 'dictating' | 'processing' | 'review' | 'success'

export default function DictatePage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Header title="Vokabeln diktieren" showBack />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        </PageContainer>
      }
    >
      <DictatePageContent />
    </Suspense>
  )
}

const LANGUAGE_LABELS: Record<Language, string> = {
  french: 'Französisch',
  spanish: 'Spanisch',
  latin: 'Latein',
}

function DictatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedBookId = searchParams.get('bookId')
  const preselectedSectionId = searchParams.get('sectionId')

  const { lastUsedSectionId, addRecentSection, setLastUsedSectionId } = useSettings()

  const { sections, isLoading: sectionsLoading } = useAllSections()
  const { books, isLoading: booksLoading } = useBooks()
  const isLoading = sectionsLoading || booksLoading

  const [step, setStep] = useState<DictationStep>('setup')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [order] = useState<DictationOrder>('foreignFirst')
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [processingError, setProcessingError] = useState<string | null>(null)

  // Dictation results
  const [rawTranscript, setRawTranscript] = useState('')
  const [candidates, setCandidates] = useState<VocabularyCandidate[]>([])

  // Pre-select section
  useEffect(() => {
    if (isLoading || selectedSectionId) return

    if (preselectedSectionId) {
      const section = sections.find((s) => s.id === preselectedSectionId)
      if (section) {
        setSelectedSectionId(section.id)
        return
      }
    }

    if (preselectedBookId) {
      const sectionInBook = sections.find((s) => s.bookId === preselectedBookId)
      if (sectionInBook) {
        setSelectedSectionId(sectionInBook.id)
        return
      }
    }

    if (lastUsedSectionId) {
      const section = sections.find((s) => s.id === lastUsedSectionId)
      if (section) {
        setSelectedSectionId(section.id)
      }
    }
  }, [sections, isLoading, preselectedBookId, preselectedSectionId, lastUsedSectionId, selectedSectionId])

  // Derive foreign language from selected section's book
  const selectedSection = sections.find((s) => s.id === selectedSectionId)
  const foreignLanguage: Language = selectedSection?.book?.language || 'french'

  // Section options for select/review
  const sectionOptions = useMemo(() => {
    let filtered = sections
    if (preselectedBookId) {
      filtered = filtered.filter((s) => s.bookId === preselectedBookId)
    }
    return filtered.map((s) => ({
      value: s.id,
      label: preselectedBookId
        ? `${s.chapter?.name || '?'} / ${s.name}`
        : `${s.book?.name || '?'} / ${s.chapter?.name || '?'} / ${s.name}`,
    }))
  }, [sections, preselectedBookId])

  // Book options for the setup screen
  const bookOptions = useMemo(() => {
    return books.map((b) => ({
      value: b.id,
      label: `${b.name} (${LANGUAGE_LABELS[b.language] || b.language})`,
    }))
  }, [books])

  const selectedBook = useMemo(() => {
    if (selectedSection?.book) return selectedSection.book
    if (preselectedBookId) return books.find((b) => b.id === preselectedBookId)
    return books[0]
  }, [selectedSection, preselectedBookId, books])

  // --- Step handlers ---

  const handleStartDictation = () => {
    setStep('dictating')
  }

  const handleDictationStop = useCallback(
    async (transcript: string, rawPairs: VocabularyCandidate[]) => {
      setRawTranscript(transcript)
      setCandidates(rawPairs) // Show heuristic results as fallback

      if (!transcript.trim()) {
        // Nothing was said — go back to setup
        setStep('setup')
        return
      }

      setStep('processing')
      setProcessingError(null)

      try {
        const refined = await refineTranscriptWithGemini(
          transcript,
          foreignLanguage,
          order
        )
        if (refined.length > 0) {
          setCandidates(refined)
        }
        // If Gemini returns nothing, keep heuristic pairs
      } catch (err) {
        console.warn('Gemini refinement failed, using heuristic results:', err)
        setProcessingError('KI-Verarbeitung fehlgeschlagen. Ergebnisse basieren auf einfacher Erkennung.')
      }

      setStep('review')
    },
    [foreignLanguage, order]
  )

  const handleUpdateCandidate = useCallback(
    (index: number, updates: Partial<VocabularyCandidate>) => {
      setCandidates((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], ...updates }
        return next
      })
    },
    []
  )

  const handleRemoveCandidate = useCallback((index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddCandidate = useCallback(() => {
    setCandidates((prev) => [
      ...prev,
      { sourceText: '', targetText: '', confidence: 1.0 },
    ])
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedSectionId) return
    const section = sections.find((s) => s.id === selectedSectionId)
    if (!section) return

    const validCandidates = candidates.filter(
      (c) => c.sourceText.trim() && c.targetText.trim()
    )
    if (validCandidates.length === 0) return

    setIsSaving(true)
    try {
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
      setLastUsedSectionId(section.id)
      addRecentSection(section.id)
      setSavedCount(validCandidates.length)
      setStep('success')
    } catch (err) {
      console.error('Failed to save vocabulary:', err)
    } finally {
      setIsSaving(false)
    }
  }, [candidates, selectedSectionId, sections, setLastUsedSectionId, addRecentSection])

  const handleCancel = useCallback(() => {
    setCandidates([])
    setRawTranscript('')
    setStep('setup')
  }, [])

  const handleDictateMore = useCallback(() => {
    setCandidates([])
    setRawTranscript('')
    setSavedCount(0)
    setStep('setup')
  }, [])

  const handleRedictate = useCallback(() => {
    // Keep existing candidates, go back to dictating to add more
    setStep('dictating')
  }, [])

  // Speech recognition not available
  const speechAvailable =
    typeof window !== 'undefined' && isSpeechRecognitionAvailable()

  // No sections available
  if (!isLoading && sections.length === 0) {
    return (
      <PageContainer>
        <Header title="Vokabeln diktieren" showBack />
        <div className="p-4">
          <div className="bg-warning-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-warning-800 mb-2">
              Keine Abschnitte vorhanden
            </h3>
            <p className="text-warning-700 mb-4">
              Erstelle zuerst ein Buch mit Kapiteln und Abschnitten.
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
        {/* Setup Step */}
        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[100dvh]"
          >
            <Header title="Vokabeln diktieren" showBack />

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {!speechAvailable ? (
                <div className="bg-warning-50 rounded-xl p-6 text-center max-w-sm">
                  <h3 className="font-semibold text-warning-800 mb-2">
                    Spracherkennung nicht verfügbar
                  </h3>
                  <p className="text-sm text-warning-700">
                    Dein Browser unterstützt keine Spracherkennung. Bitte verwende
                    Chrome oder Safari.
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                    <Mic className="w-10 h-10 text-primary-500" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Vokabeln einsprechen
                  </h3>
                  <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
                    Sprich deine Vokabeln nacheinander: Fremdwort, Übersetzung, Fremdwort, Übersetzung, ...
                  </p>

                  {/* Book selection (if no section selected yet) */}
                  {bookOptions.length > 0 && (
                    <div className="w-full max-w-xs mb-4">
                      <Select
                        label="Buch / Sprache"
                        options={bookOptions}
                        value={selectedBook?.id || ''}
                        onChange={(e) => {
                          const book = books.find((b) => b.id === e.target.value)
                          if (book) {
                            const sectionInBook = sections.find(
                              (s) => s.bookId === book.id
                            )
                            if (sectionInBook) {
                              setSelectedSectionId(sectionInBook.id)
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Section selection */}
                  {sectionOptions.length > 0 && (
                    <div className="w-full max-w-xs mb-6">
                      <Select
                        label="Ziel-Abschnitt"
                        options={sectionOptions}
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        placeholder="Abschnitt auswählen"
                      />
                    </div>
                  )}

                  {selectedBook && (
                    <p className="text-xs text-gray-400 mb-4">
                      Sprache: {LANGUAGE_LABELS[selectedBook.language] || selectedBook.language} → Deutsch
                    </p>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleStartDictation}
                    disabled={!selectedSectionId}
                    className="px-8"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Aufnahme starten
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Dictating Step */}
        {step === 'dictating' && (
          <motion.div
            key="dictating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[100dvh]"
          >
            <VoiceDictationView
              foreignLanguage={foreignLanguage}
              order={order}
              onStop={handleDictationStop}
            />
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
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full mb-6"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vokabeln werden erkannt...
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Die KI bereinigt deine Eingabe und korrigiert die Fremdwörter.
              </p>
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
                <Button variant="outline" size="sm" onClick={handleRedictate}>
                  <Mic className="w-4 h-4 mr-1" />
                  Mehr diktieren
                </Button>
              }
            />

            {/* Processing error banner */}
            {processingError && (
              <div className="px-4 py-2 bg-warning-50 border-b border-warning-200">
                <p className="text-sm text-warning-700">{processingError}</p>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <OCRReview
                candidates={candidates}
                sections={sectionOptions}
                selectedSectionId={selectedSectionId}
                targetLanguage={foreignLanguage}
                onSectionChange={setSelectedSectionId}
                onUpdateCandidate={handleUpdateCandidate}
                onRemoveCandidate={handleRemoveCandidate}
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
                Die Vokabeln wurden erfolgreich gespeichert und können jetzt geübt werden.
              </p>

              <div className="space-y-3 w-full max-w-xs">
                <Button variant="primary" fullWidth onClick={handleDictateMore}>
                  Weitere diktieren
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push('/practice')}
                >
                  Jetzt üben
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => router.push('/library')}
                >
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
