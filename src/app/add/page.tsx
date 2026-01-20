'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { createVocabularyItem } from '@/lib/db/db'
import { getLangCode, SOURCE_LANG_CODE } from '@/lib/utils/language-codes'

function AddVocabularyForm() {
  const searchParams = useSearchParams()
  const initialSectionId = searchParams.get('sectionId')

  const { sections, isLoading } = useAllSections()
  const sourceInputRef = useRef<HTMLInputElement>(null)

  const [sectionId, setSectionId] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (initialSectionId && sections.length > 0) {
      const sectionExists = sections.some((s) => s.id === initialSectionId)
      if (sectionExists) {
        setSectionId(initialSectionId)
      }
    }
  }, [initialSectionId, sections])

  const sectionOptions = sections.map((section) => ({
    value: section.id,
    label: `${section.book?.name} › ${section.chapter?.name} › ${section.name}`,
  }))

  const selectedSection = sections.find((s) => s.id === sectionId)

  const resetForm = () => {
    setSourceText('')
    setTargetText('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceText.trim() || !targetText.trim() || !sectionId) return

    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    setIsSubmitting(true)
    try {
      await createVocabularyItem({
        sourceText: sourceText.trim(),
        targetText: targetText.trim(),
        notes: notes.trim() || undefined,
        sectionId: section.id,
        chapterId: section.chapterId,
        bookId: section.bookId,
      })
      setSavedCount((prev) => prev + 1)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      resetForm()
      sourceInputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = sourceText.trim() && targetText.trim() && sectionId

  return (
    <>
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <div className="bg-success-500 text-white rounded-xl py-3 px-4 shadow-lg flex items-center gap-3 max-w-md mx-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">Gespeichert!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <Card>
          <CardContent className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </CardContent>
        </Card>
      ) : sections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Keine Abschnitte vorhanden</h3>
            <p className="text-gray-500 text-sm mb-4">
              Erstelle zuerst ein Buch mit Kapiteln und Abschnitten.
            </p>
            <Link href="/library">
              <Button variant="primary">Zur Bibliothek</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardContent className="space-y-4">
              <Select
                label="Abschnitt"
                options={sectionOptions}
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                placeholder="Wähle einen Abschnitt..."
              />

              <Input
                ref={sourceInputRef}
                label="Deutsch"
                placeholder="z.B. das Haus"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                autoFocus
                spellCheck
                lang={SOURCE_LANG_CODE}
              />

              <Input
                label={
                  selectedSection?.book?.language === 'french'
                    ? 'Französisch'
                    : selectedSection?.book?.language === 'spanish'
                      ? 'Spanisch'
                      : selectedSection?.book?.language === 'latin'
                        ? 'Latein'
                        : 'Fremdsprache'
                }
                placeholder={
                  selectedSection?.book?.language === 'french'
                    ? 'z.B. la maison'
                    : selectedSection?.book?.language === 'spanish'
                      ? 'z.B. la casa'
                      : selectedSection?.book?.language === 'latin'
                        ? 'z.B. domus'
                        : 'Übersetzung'
                }
                value={targetText}
                onChange={(e) => setTargetText(e.target.value)}
                spellCheck
                lang={getLangCode(selectedSection?.book?.language)}
              />

              <Textarea
                label="Notizen (optional)"
                placeholder="z.B. Plural: die Häuser"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            Speichern & Weiter
          </Button>

          {savedCount > 0 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              {savedCount} Vokabel{savedCount !== 1 ? 'n' : ''} in dieser Sitzung gespeichert
            </p>
          )}
        </form>
      )}
    </>
  )
}

export default function AddVocabularyPage() {
  return (
    <PageContainer>
      <Header
        title="Vokabeln hinzufügen"
        action={
          <Link href="/add/scan">
            <Button variant="outline" size="sm">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Scannen
            </Button>
          </Link>
        }
      />

      <Suspense
        fallback={
          <Card>
            <CardContent className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-xl" />
            </CardContent>
          </Card>
        }
      >
        <AddVocabularyForm />
      </Suspense>
    </PageContainer>
  )
}
