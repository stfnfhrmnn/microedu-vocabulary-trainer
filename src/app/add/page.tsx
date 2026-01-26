'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Plus, Clock, X } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { createVocabularyItem, createSection } from '@/lib/db/db'
import { getLangCode, SOURCE_LANG_CODE } from '@/lib/utils/language-codes'
import { useSettings } from '@/stores/settings'

// Group sections by book and chapter for hierarchical display
interface GroupedSections {
  bookId: string
  bookName: string
  chapters: {
    chapterId: string
    chapterName: string
    sections: {
      id: string
      name: string
    }[]
  }[]
}

function AddVocabularyForm() {
  const searchParams = useSearchParams()
  const urlSectionId = searchParams.get('sectionId')
  const { lastUsedSectionId, setLastUsedSectionId, recentSectionIds, addRecentSection } = useSettings()

  // Use URL param first, then fall back to last used section
  const initialSectionId = urlSectionId || lastUsedSectionId

  const { sections, isLoading } = useAllSections()
  const sourceInputRef = useRef<HTMLInputElement>(null)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [showCreateSection, setShowCreateSection] = useState(false)
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  // New section form state
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionChapterId, setNewSectionChapterId] = useState('')
  const [isCreatingSection, setIsCreatingSection] = useState(false)

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

  // Group sections by book and chapter
  const groupedSections = useMemo((): GroupedSections[] => {
    const groups = new Map<string, GroupedSections>()

    for (const section of sections) {
      if (!section.book || !section.chapter) continue

      let bookGroup = groups.get(section.bookId)
      if (!bookGroup) {
        bookGroup = {
          bookId: section.bookId,
          bookName: section.book.name,
          chapters: []
        }
        groups.set(section.bookId, bookGroup)
      }

      let chapter = bookGroup.chapters.find(c => c.chapterId === section.chapterId)
      if (!chapter) {
        chapter = {
          chapterId: section.chapterId,
          chapterName: section.chapter.name,
          sections: []
        }
        bookGroup.chapters.push(chapter)
      }

      chapter.sections.push({
        id: section.id,
        name: section.name
      })
    }

    return Array.from(groups.values())
  }, [sections])

  // Get recent sections that still exist
  const recentSections = useMemo(() => {
    return recentSectionIds
      .map(id => sections.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
      .slice(0, 5)
  }, [recentSectionIds, sections])

  // Get chapter options for new section creation (derive from sections)
  const chapterOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { value: string; label: string; bookId: string }[] = []

    for (const section of sections) {
      if (!section.chapter || !section.book || seen.has(section.chapterId)) continue
      seen.add(section.chapterId)
      options.push({
        value: section.chapterId,
        label: `${section.book.name} › ${section.chapter.name}`,
        bookId: section.bookId,
      })
    }

    return options
  }, [sections])

  const selectedSection = sections.find((s) => s.id === sectionId)

  const resetForm = () => {
    setSourceText('')
    setTargetText('')
    setNotes('')
  }

  const handleSelectSection = (id: string) => {
    setSectionId(id)
    setShowSectionPicker(false)
    addRecentSection(id)
  }

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !newSectionChapterId) return

    const chapterOption = chapterOptions.find(c => c.value === newSectionChapterId)
    if (!chapterOption) return

    // Calculate order based on existing sections in this chapter
    const existingSectionsInChapter = sections.filter(s => s.chapterId === newSectionChapterId)
    const nextOrder = existingSectionsInChapter.length

    setIsCreatingSection(true)
    try {
      const newSection = await createSection({
        name: newSectionName.trim(),
        chapterId: newSectionChapterId,
        bookId: chapterOption.bookId,
        order: nextOrder,
        coveredInClass: false,
      })
      setSectionId(newSection.id)
      addRecentSection(newSection.id)
      setNewSectionName('')
      setNewSectionChapterId('')
      setShowCreateSection(false)
      setShowSectionPicker(false)
    } finally {
      setIsCreatingSection(false)
    }
  }

  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => {
      const next = new Set(prev)
      if (next.has(bookId)) {
        next.delete(bookId)
      } else {
        next.add(bookId)
      }
      return next
    })
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
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
      // Remember this section for next time
      setLastUsedSectionId(section.id)
      addRecentSection(section.id)
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

      {/* Create Section Modal */}
      <AnimatePresence>
        {showCreateSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCreateSection(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Neuer Abschnitt</h3>
                <button
                  onClick={() => setShowCreateSection(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <Select
                  label="Kapitel"
                  options={chapterOptions}
                  value={newSectionChapterId}
                  onChange={(e) => setNewSectionChapterId(e.target.value)}
                  placeholder="Wähle ein Kapitel..."
                />
                <Input
                  label="Abschnittsname"
                  placeholder="z.B. Lektion 3.1"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCreateSection}
                  loading={isCreatingSection}
                  disabled={!newSectionName.trim() || !newSectionChapterId}
                >
                  Abschnitt erstellen
                </Button>
              </div>
            </motion.div>
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
          {/* Section Context - Always Visible */}
          {selectedSection && !showSectionPicker ? (
            <Card className="mb-4 bg-primary-50 border-primary-200">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-primary-600 font-medium mb-0.5">Hinzufügen zu:</p>
                    <p className="text-sm font-semibold text-primary-900 truncate">
                      {selectedSection.book?.name} › {selectedSection.chapter?.name} › {selectedSection.name}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSectionPicker(true)}
                    className="ml-3 flex-shrink-0"
                  >
                    Ändern
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Abschnitt auswählen</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateSection(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Neu
                  </button>
                </div>

                {/* Recent Sections Pills */}
                {recentSections.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>Zuletzt verwendet</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSections.map((section) => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => handleSelectSection(section.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            sectionId === section.id
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {section.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grouped Section Tree */}
                <div className="border rounded-xl overflow-hidden">
                  {groupedSections.map((book) => (
                    <div key={book.bookId} className="border-b last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleBook(book.bookId)}
                        className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 text-left"
                      >
                        {expandedBooks.has(book.bookId) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">{book.bookName}</span>
                      </button>

                      <AnimatePresence>
                        {expandedBooks.has(book.bookId) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            {book.chapters.map((chapter) => (
                              <div key={chapter.chapterId} className="border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => toggleChapter(chapter.chapterId)}
                                  className="w-full flex items-center gap-2 p-3 pl-8 hover:bg-gray-50 text-left"
                                >
                                  {expandedChapters.has(chapter.chapterId) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-gray-700">{chapter.chapterName}</span>
                                </button>

                                <AnimatePresence>
                                  {expandedChapters.has(chapter.chapterId) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      {chapter.sections.map((section) => (
                                        <button
                                          key={section.id}
                                          type="button"
                                          onClick={() => handleSelectSection(section.id)}
                                          className={`w-full p-3 pl-14 text-left transition-colors ${
                                            sectionId === section.id
                                              ? 'bg-primary-50 text-primary-700 font-medium'
                                              : 'hover:bg-gray-50 text-gray-600'
                                          }`}
                                        >
                                          {section.name}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {sectionId && showSectionPicker && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSectionPicker(false)}
                    className="mt-3"
                  >
                    Abbrechen
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mb-4">
            <CardContent className="space-y-4">

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
