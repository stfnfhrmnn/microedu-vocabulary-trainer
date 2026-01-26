'use client'

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Plus, Clock, X, BookOpen, Search } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useAllSections, useBooks } from '@/lib/db/hooks/useBooks'
import { createVocabularyItem, createSection, createBook, createChapter } from '@/lib/db/db'
import { getLangCode, SOURCE_LANG_CODE } from '@/lib/utils/language-codes'
import { useSettings } from '@/stores/settings'
import type { Book, Language } from '@/lib/db/schema'

// Selection can be either a section or a book (for unsorted vocab)
interface Selection {
  type: 'section' | 'book'
  bookId: string
  bookName: string
  bookLanguage?: Language
  chapterId?: string
  chapterName?: string
  sectionId?: string
  sectionName?: string
}

// Group sections by book and chapter for hierarchical display
interface GroupedSections {
  bookId: string
  bookName: string
  bookLanguage?: Language
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
  const urlBookId = searchParams.get('bookId')
  const { lastUsedSectionId, setLastUsedSectionId, recentSectionIds, addRecentSection } = useSettings()

  const { sections, isLoading: sectionsLoading } = useAllSections()
  const { books, isLoading: booksLoading } = useBooks()
  const isLoading = sectionsLoading || booksLoading

  const sourceInputRef = useRef<HTMLInputElement>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showCreateSection, setShowCreateSection] = useState(false)
  const [showQuickStart, setShowQuickStart] = useState(false)
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // New section form state
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionChapterId, setNewSectionChapterId] = useState('')
  const [newChapterName, setNewChapterName] = useState('')
  const [createChapterMode, setCreateChapterMode] = useState(false)
  const [selectedBookForChapter, setSelectedBookForChapter] = useState('')
  const [isCreatingSection, setIsCreatingSection] = useState(false)

  // Quick start form state
  const [quickStartBookName, setQuickStartBookName] = useState('')
  const [quickStartLanguage, setQuickStartLanguage] = useState<'french' | 'spanish' | 'latin'>('french')
  const [isCreatingQuickStart, setIsCreatingQuickStart] = useState(false)

  // Current selection (either a section or a book for unsorted vocab)
  const [selection, setSelection] = useState<Selection | null>(null)

  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize selection from URL or last used
  useEffect(() => {
    if (isLoading) return

    // Try URL section first
    if (urlSectionId) {
      const section = sections.find((s) => s.id === urlSectionId)
      if (section && section.book) {
        setSelection({
          type: 'section',
          bookId: section.bookId,
          bookName: section.book.name,
          bookLanguage: section.book.language,
          chapterId: section.chapterId,
          chapterName: section.chapter?.name,
          sectionId: section.id,
          sectionName: section.name,
        })
        return
      }
    }

    // Try URL book (for unsorted)
    if (urlBookId) {
      const book = books.find((b) => b.id === urlBookId)
      if (book) {
        setSelection({
          type: 'book',
          bookId: book.id,
          bookName: book.name,
          bookLanguage: book.language,
        })
        return
      }
    }

    // Try last used section
    if (lastUsedSectionId) {
      const section = sections.find((s) => s.id === lastUsedSectionId)
      if (section && section.book) {
        setSelection({
          type: 'section',
          bookId: section.bookId,
          bookName: section.book.name,
          bookLanguage: section.book.language,
          chapterId: section.chapterId,
          chapterName: section.chapter?.name,
          sectionId: section.id,
          sectionName: section.name,
        })
      }
    }
  }, [urlSectionId, urlBookId, lastUsedSectionId, sections, books, isLoading])

  // Group sections by book and chapter, include books without sections
  const groupedSections = useMemo((): GroupedSections[] => {
    const groups = new Map<string, GroupedSections>()

    // First, add all books (even those without sections)
    for (const book of books) {
      groups.set(book.id, {
        bookId: book.id,
        bookName: book.name,
        bookLanguage: book.language,
        chapters: []
      })
    }

    // Then add sections to their books
    for (const section of sections) {
      if (!section.book || !section.chapter) continue

      const bookGroup = groups.get(section.bookId)
      if (!bookGroup) continue

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
  }, [sections, books])

  // Get recent selections with full context
  const recentSelections = useMemo((): Selection[] => {
    const results: Selection[] = []
    for (const id of recentSectionIds) {
      if (results.length >= 5) break
      const section = sections.find(s => s.id === id)
      if (section && section.book) {
        results.push({
          type: 'section',
          bookId: section.bookId,
          bookName: section.book.name,
          bookLanguage: section.book.language,
          chapterId: section.chapterId,
          chapterName: section.chapter?.name,
          sectionId: section.id,
          sectionName: section.name,
        })
      }
    }
    return results
  }, [recentSectionIds, sections])

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    return sections
      .filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.book?.name.toLowerCase().includes(query) ||
        s.chapter?.name.toLowerCase().includes(query)
      )
      .slice(0, 10)
  }, [searchQuery, sections])

  // Check for potential language mismatch (German text in foreign language field)
  const languageMismatchWarning = useMemo(() => {
    if (!targetText.trim() || !selection?.bookLanguage) return null

    const text = targetText.toLowerCase().trim()

    // German-specific patterns
    const hasGermanChar = /[äöüß]/i.test(text)
    const startsWithGermanArticle = /^(der|die|das|ein|eine|einen|einem|einer)\s/i.test(text)
    const hasGermanEndings = /[^\s]+(ung|heit|keit|lich|isch)$/i.test(text)

    if (hasGermanChar || startsWithGermanArticle || hasGermanEndings) {
      const langName = selection.bookLanguage === 'french' ? 'Französisch'
        : selection.bookLanguage === 'spanish' ? 'Spanisch'
        : 'Latein'
      return `Dieser Text sieht nach Deutsch aus. Sollte hier nicht ${langName} stehen?`
    }

    return null
  }, [targetText, selection?.bookLanguage])

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

  const resetForm = () => {
    setSourceText('')
    setTargetText('')
    setNotes('')
  }

  const handleSelectSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (section && section.book) {
      setSelection({
        type: 'section',
        bookId: section.bookId,
        bookName: section.book.name,
        bookLanguage: section.book.language,
        chapterId: section.chapterId,
        chapterName: section.chapter?.name,
        sectionId: section.id,
        sectionName: section.name,
      })
      addRecentSection(section.id)
    }
    setShowPicker(false)
    setSearchQuery('')
  }

  const handleSelectBook = (book: GroupedSections) => {
    setSelection({
      type: 'book',
      bookId: book.bookId,
      bookName: book.bookName,
      bookLanguage: book.bookLanguage,
    })
    setShowPicker(false)
    setSearchQuery('')
  }

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return

    // If creating new chapter first
    if (createChapterMode && newChapterName.trim() && selectedBookForChapter) {
      setIsCreatingSection(true)
      try {
        // Create the chapter
        const newChapter = await createChapter({
          name: newChapterName.trim(),
          bookId: selectedBookForChapter,
          order: 0, // Will be sorted later
        })
        // Then create the section
        const newSection = await createSection({
          name: newSectionName.trim(),
          chapterId: newChapter.id,
          bookId: selectedBookForChapter,
          order: 0,
          coveredInClass: false,
        })
        const book = books.find(b => b.id === selectedBookForChapter)
        if (book) {
          setSelection({
            type: 'section',
            bookId: book.id,
            bookName: book.name,
            bookLanguage: book.language,
            chapterId: newChapter.id,
            chapterName: newChapter.name,
            sectionId: newSection.id,
            sectionName: newSection.name,
          })
          addRecentSection(newSection.id)
        }
        resetCreateSectionForm()
      } finally {
        setIsCreatingSection(false)
      }
      return
    }

    // Normal section creation with existing chapter
    if (!newSectionChapterId) return
    const chapterOption = chapterOptions.find(c => c.value === newSectionChapterId)
    if (!chapterOption) return

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
      const section = sections.find(s => s.id === newSection.id) || {
        ...newSection,
        book: books.find(b => b.id === chapterOption.bookId),
        chapter: { name: chapterOption.label.split(' › ')[1] }
      }
      const book = books.find(b => b.id === chapterOption.bookId)
      if (book) {
        setSelection({
          type: 'section',
          bookId: book.id,
          bookName: book.name,
          bookLanguage: book.language,
          chapterId: newSectionChapterId,
          chapterName: chapterOption.label.split(' › ')[1],
          sectionId: newSection.id,
          sectionName: newSection.name,
        })
        addRecentSection(newSection.id)
      }
      resetCreateSectionForm()
    } finally {
      setIsCreatingSection(false)
    }
  }

  const resetCreateSectionForm = () => {
    setNewSectionName('')
    setNewSectionChapterId('')
    setNewChapterName('')
    setCreateChapterMode(false)
    setSelectedBookForChapter('')
    setShowCreateSection(false)
    setShowPicker(false)
  }

  const handleQuickStart = async () => {
    if (!quickStartBookName.trim()) return

    setIsCreatingQuickStart(true)
    try {
      const newBook = await createBook({
        name: quickStartBookName.trim(),
        language: quickStartLanguage,
        coverColor: '#3B82F6', // Default blue
      })
      setSelection({
        type: 'book',
        bookId: newBook.id,
        bookName: newBook.name,
        bookLanguage: newBook.language,
      })
      setQuickStartBookName('')
      setShowQuickStart(false)
    } finally {
      setIsCreatingQuickStart(false)
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
    if (!sourceText.trim() || !targetText.trim() || !selection) return

    setIsSubmitting(true)
    try {
      await createVocabularyItem({
        sourceText: sourceText.trim(),
        targetText: targetText.trim(),
        notes: notes.trim() || undefined,
        sectionId: selection.sectionId || null,
        chapterId: selection.chapterId || null,
        bookId: selection.bookId,
      })
      // Remember this selection for next time
      if (selection.sectionId) {
        setLastUsedSectionId(selection.sectionId)
        addRecentSection(selection.sectionId)
      }
      setSavedCount((prev) => prev + 1)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      resetForm()
      sourceInputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to save from anywhere
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (sourceText.trim() && targetText.trim() && selection) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
  }, [sourceText, targetText, selection])

  const canSubmit = sourceText.trim() && targetText.trim() && selection

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
                {!createChapterMode ? (
                  <>
                    <div>
                      <Select
                        label="Kapitel"
                        options={chapterOptions}
                        value={newSectionChapterId}
                        onChange={(e) => setNewSectionChapterId(e.target.value)}
                        placeholder="Wähle ein Kapitel..."
                      />
                      <button
                        type="button"
                        onClick={() => setCreateChapterMode(true)}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Neues Kapitel erstellen
                      </button>
                    </div>
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
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-primary-50 rounded-xl border border-primary-100">
                      <p className="text-sm text-primary-700 font-medium mb-3">Neues Kapitel erstellen</p>
                      <div className="space-y-3">
                        <Select
                          label="Buch"
                          options={books.map(b => ({ value: b.id, label: b.name }))}
                          value={selectedBookForChapter}
                          onChange={(e) => setSelectedBookForChapter(e.target.value)}
                          placeholder="Wähle ein Buch..."
                        />
                        <Input
                          label="Kapitelname"
                          placeholder="z.B. Unité 3"
                          value={newChapterName}
                          onChange={(e) => setNewChapterName(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateChapterMode(false)
                          setNewChapterName('')
                          setSelectedBookForChapter('')
                        }}
                        className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Abbrechen
                      </button>
                    </div>
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
                      disabled={!newSectionName.trim() || !newChapterName.trim() || !selectedBookForChapter}
                    >
                      Kapitel & Abschnitt erstellen
                    </Button>
                  </>
                )}
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
      ) : books.length === 0 ? (
        // Empty state - no books yet, show quick start
        <Card>
          <CardContent className="py-8">
            {!showQuickStart ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Leg los!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Erstelle dein erstes Vokabelbuch, um Wörter hinzuzufügen.
                </p>
                <Button variant="primary" onClick={() => setShowQuickStart(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Buch erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Neues Buch</h3>
                  <button
                    onClick={() => setShowQuickStart(false)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <Input
                  label="Name"
                  placeholder="z.B. Découvertes 1 oder Meine Vokabeln"
                  value={quickStartBookName}
                  onChange={(e) => setQuickStartBookName(e.target.value)}
                  autoFocus
                />
                <Select
                  label="Sprache"
                  value={quickStartLanguage}
                  onChange={(e) => setQuickStartLanguage(e.target.value as 'french' | 'spanish' | 'latin')}
                  options={[
                    { value: 'french', label: 'Französisch' },
                    { value: 'spanish', label: 'Spanisch' },
                    { value: 'latin', label: 'Latein' },
                  ]}
                />
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleQuickStart}
                  loading={isCreatingQuickStart}
                  disabled={!quickStartBookName.trim()}
                >
                  Buch erstellen & loslegen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          {/* Selection Context - Always Visible */}
          {selection && !showPicker ? (
            <Card className="mb-4 bg-primary-50 border-primary-200">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-primary-600 font-medium mb-0.5">Hinzufügen zu:</p>
                    <p className="text-sm font-semibold text-primary-900 truncate">
                      {selection.type === 'book' ? (
                        <>{selection.bookName} <span className="font-normal text-primary-600">(Unsortiert)</span></>
                      ) : (
                        <>{selection.bookName} › {selection.chapterName} › {selection.sectionName}</>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPicker(true)}
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
                  <p className="text-sm font-medium text-gray-700">Wohin hinzufügen?</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateSection(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Neu
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Search Results */}
                {filteredSections && filteredSections.length > 0 && (
                  <div className="mb-4 border rounded-xl overflow-hidden">
                    {filteredSections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => handleSelectSection(section.id)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">{section.name}</span>
                        <span className="text-xs text-gray-500 block">
                          {section.book?.name} › {section.chapter?.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredSections && filteredSections.length === 0 && searchQuery && (
                  <p className="text-sm text-gray-500 text-center py-4 mb-4">
                    Keine Ergebnisse für &quot;{searchQuery}&quot;
                  </p>
                )}

                {/* Recent Selections with Context */}
                {!searchQuery && recentSelections.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>Zuletzt verwendet</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSelections.map((sel) => (
                        <button
                          key={sel.sectionId}
                          type="button"
                          onClick={() => sel.sectionId && handleSelectSection(sel.sectionId)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selection?.sectionId === sel.sectionId
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={`${sel.bookName} › ${sel.sectionName}`}
                        >
                          <span className="text-xs opacity-70">{sel.bookName} › </span>
                          {sel.sectionName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grouped Section Tree */}
                {!searchQuery && (
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
                              {/* Unsorted option - book level */}
                              <button
                                type="button"
                                onClick={() => handleSelectBook(book)}
                                className={`w-full p-3 pl-8 text-left border-t border-gray-100 transition-colors ${
                                  selection?.type === 'book' && selection.bookId === book.bookId
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-gray-50 text-gray-500 italic'
                                }`}
                              >
                                Unsortiert (schnell hinzufügen)
                              </button>

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
                                              selection?.sectionId === section.id
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
                )}

                {selection && showPicker && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPicker(false)}
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

              <div>
                <Input
                  label={
                    selection?.bookLanguage === 'french'
                      ? 'Französisch'
                      : selection?.bookLanguage === 'spanish'
                        ? 'Spanisch'
                        : selection?.bookLanguage === 'latin'
                          ? 'Latein'
                          : 'Fremdsprache'
                  }
                  placeholder={
                    selection?.bookLanguage === 'french'
                      ? 'z.B. la maison'
                      : selection?.bookLanguage === 'spanish'
                        ? 'z.B. la casa'
                        : selection?.bookLanguage === 'latin'
                          ? 'z.B. domus'
                          : 'Übersetzung'
                  }
                  value={targetText}
                  onChange={(e) => setTargetText(e.target.value)}
                  spellCheck
                  lang={getLangCode(selection?.bookLanguage)}
                />
                {languageMismatchWarning && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                    <span className="text-amber-500">⚠️</span>
                    {languageMismatchWarning}
                  </p>
                )}
              </div>

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

          <p className="text-center text-xs text-gray-400 mt-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">⌘</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">↵</kbd>
            {' zum Speichern'}
          </p>

          {savedCount > 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">
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
