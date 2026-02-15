'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Eye,
  Plus,
  X,
  BookOpen,
  MessageCircle,
  Play,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { db } from '@/lib/db/db'
import { useGroupVoiceSession } from '@/stores/group-voice-session'
import { useGoogleApiStatus } from '@/hooks/useGoogleApiStatus'
import type { Language, VocabularyItem } from '@/lib/db/schema'
import type {
  GroupSessionMode,
  ImmersionLevel,
  TimingMode,
  ContentSource,
} from '@/stores/group-voice-session'

interface BookOption {
  id: string
  name: string
  language: Language
  wordCount: number
}

interface SectionOption {
  id: string
  name: string
  bookName: string
  wordCount: number
}

const immersionOptions = [
  { value: 'beginner', label: 'Anfänger', description: 'Hauptsächlich Deutsch' },
  {
    value: 'intermediate',
    label: 'Mittelstufe',
    description: 'Fragen auf Zielsprache, Hilfe auf Deutsch',
  },
  {
    value: 'advanced',
    label: 'Fortgeschritten',
    description: 'Fast nur Zielsprache',
  },
  { value: 'full', label: 'Immersion', description: 'Nur Zielsprache' },
]

const timingOptions = [
  { value: 'calm', label: 'Ruhig', description: 'Mehr Zeit, entspannter' },
  { value: 'challenge', label: 'Challenge', description: 'Schneller, energetischer' },
]

const languageOptions = [
  { value: 'french', label: 'Französisch' },
  { value: 'spanish', label: 'Spanisch' },
  { value: 'latin', label: 'Latein' },
]

export default function GroupPracticeSetupPage() {
  const router = useRouter()
  const { available: hasGoogleApi, loading: googleApiLoading } = useGoogleApiStatus()
  const { initSession, addPlayer, addSpectator, players, spectators, reset } =
    useGroupVoiceSession()

  // Setup state
  const [step, setStep] = useState<'participants' | 'content' | 'settings'>(
    'participants'
  )
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newSpectatorName, setNewSpectatorName] = useState('')

  // Content state
  const [contentType, setContentType] = useState<'sections' | 'book' | 'topic'>(
    'sections'
  )
  const [selectedSections, setSelectedSections] = useState<SectionOption[]>([])
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null)
  const [topicText, setTopicText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState<Language>('french')

  // Settings state
  const mode: GroupSessionMode = 'lernkreis'
  const [immersionLevel, setImmersionLevel] =
    useState<ImmersionLevel>('intermediate')
  const [timingMode, setTimingMode] = useState<TimingMode>('calm')

  // Available content
  const [books, setBooks] = useState<BookOption[]>([])
  const [sections, setSections] = useState<SectionOption[]>([])

  // Load books and sections
  useEffect(() => {
    reset() // Reset session state on mount

    const loadContent = async () => {
      const allBooks = await db.books.toArray()
      const allChapters = await db.chapters.toArray()
      const allSections = await db.sections.toArray()
      const allVocab = await db.vocabularyItems.toArray()

      // Count words per section
      const sectionWordCounts = new Map<string, number>()
      for (const vocab of allVocab) {
        if (!vocab.sectionId) continue
        const count = sectionWordCounts.get(vocab.sectionId) || 0
        sectionWordCounts.set(vocab.sectionId, count + 1)
      }

      // Build book options
      const bookOptions: BookOption[] = allBooks.map((book) => {
        const bookSections = allSections.filter((s) => {
          const chapter = allChapters.find((c) => c.id === s.chapterId)
          return chapter?.bookId === book.id
        })
        const wordCount = bookSections.reduce(
          (sum, s) => sum + (sectionWordCounts.get(s.id) || 0),
          0
        )
        return {
          id: book.id,
          name: book.name,
          language: book.language,
          wordCount,
        }
      })

      // Build section options
      const sectionOptions: SectionOption[] = allSections
        .filter((s) => (sectionWordCounts.get(s.id) || 0) > 0)
        .map((section) => {
          const chapter = allChapters.find((c) => c.id === section.chapterId)
          const book = allBooks.find((b) => b.id === chapter?.bookId)
          return {
            id: section.id,
            name: section.name,
            bookName: book?.name || '',
            wordCount: sectionWordCounts.get(section.id) || 0,
          }
        })

      setBooks(bookOptions)
      setSections(sectionOptions)
    }

    loadContent()
  }, [reset])

  // Add player handler
  const handleAddPlayer = () => {
    if (newPlayerName.trim() && players.length < 4) {
      addPlayer(newPlayerName.trim())
      setNewPlayerName('')
    }
  }

  // Add spectator handler
  const handleAddSpectator = () => {
    if (newSpectatorName.trim()) {
      addSpectator(newSpectatorName.trim())
      setNewSpectatorName('')
    }
  }

  // Remove participant handler
  const handleRemoveParticipant = (id: string) => {
    useGroupVoiceSession.getState().removeParticipant(id)
  }

  // Toggle section selection
  const toggleSection = (section: SectionOption) => {
    if (selectedSections.find((s) => s.id === section.id)) {
      setSelectedSections(selectedSections.filter((s) => s.id !== section.id))
    } else {
      setSelectedSections([...selectedSections, section])
    }
  }

  // Start session
  const handleStart = async () => {
    // Build content source
    let contentSource: ContentSource
    let vocabularyPool: VocabularyItem[] = []

    if (contentType === 'sections' && selectedSections.length > 0) {
      contentSource = {
        type: 'sections',
        sectionIds: selectedSections.map((s) => s.id),
        sectionNames: selectedSections.map((s) => s.name),
      }
      vocabularyPool = await db.vocabularyItems
        .where('sectionId')
        .anyOf(selectedSections.map((s) => s.id))
        .toArray()
    } else if (contentType === 'book' && selectedBook) {
      const chapters = await db.chapters
        .where('bookId')
        .equals(selectedBook.id)
        .toArray()
      const sectionsList = await db.sections
        .where('chapterId')
        .anyOf(chapters.map((c) => c.id))
        .toArray()
      contentSource = {
        type: 'book',
        bookId: selectedBook.id,
        bookName: selectedBook.name,
      }
      vocabularyPool = await db.vocabularyItems
        .where('sectionId')
        .anyOf(sectionsList.map((s) => s.id))
        .toArray()
    } else if (contentType === 'topic' && topicText.trim()) {
      contentSource = {
        type: 'topic',
        topic: topicText.trim(),
      }
      // For topic-based, we'll let the LLM generate questions
      // But we can still pull from library as backup
      vocabularyPool = await db.vocabularyItems.toArray()
    } else {
      return // Invalid content selection
    }

    // Initialize session
    initSession({
      mode,
      targetLanguage,
      immersionLevel,
      timingMode,
      contentSource,
      vocabularyPool,
    })

    // Navigate to session
    router.push('/practice/group/session')
  }

  // Check if API key is configured
  if (!hasGoogleApi && !googleApiLoading) {
    return (
      <PageContainer>
        <Header title="Gruppen-Übung" showBack />
        <Card>
          <CardContent className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">
              API-Schlüssel erforderlich
            </h3>
            <p className="text-gray-600 mb-4">
              Für die Gruppen-Übung wird ein Google Cloud API-Schlüssel mit
              aktivierter Gemini API benötigt.
            </p>
            <Button onClick={() => router.push('/settings')}>
              Zu den Einstellungen
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const canProceedFromParticipants = players.length >= 2
  const canProceedFromContent =
    (contentType === 'sections' && selectedSections.length > 0) ||
    (contentType === 'book' && selectedBook) ||
    (contentType === 'topic' && topicText.trim())
  const canStart = canProceedFromParticipants && canProceedFromContent

  return (
    <PageContainer>
      <Header title="Gruppen-Übung" showBack />

      {/* Progress steps */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('participants')}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === 'participants'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            1
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => canProceedFromParticipants && setStep('content')}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === 'content'
                ? 'bg-primary-600 text-white'
                : canProceedFromParticipants
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            2
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() =>
              canProceedFromParticipants &&
              canProceedFromContent &&
              setStep('settings')
            }
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === 'settings'
                ? 'bg-primary-600 text-white'
                : canProceedFromContent
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            3
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Participants */}
        {step === 'participants' && (
          <motion.div
            key="participants"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">
                    Spieler (2-4)
                  </h3>
                </div>

                {/* Current players */}
                <div className="space-y-2 mb-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-primary-900">
                        {player.name}
                      </span>
                      <button
                        onClick={() => handleRemoveParticipant(player.id)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add player */}
                {players.length < 4 && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name eingeben..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    />
                    <Button
                      onClick={handleAddPlayer}
                      disabled={!newPlayerName.trim()}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">
                    Zuschauer (optional)
                  </h3>
                </div>

                {/* Current spectators */}
                <div className="space-y-2 mb-4">
                  {spectators.map((spectator) => (
                    <div
                      key={spectator.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-gray-700">{spectator.name}</span>
                      <button
                        onClick={() => handleRemoveParticipant(spectator.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add spectator */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Name eingeben..."
                    value={newSpectatorName}
                    onChange={(e) => setNewSpectatorName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddSpectator()
                    }
                  />
                  <Button
                    onClick={handleAddSpectator}
                    disabled={!newSpectatorName.trim()}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Zuschauer können Tipps geben, aber nicht punkten.
                </p>
              </CardContent>
            </Card>

            <Button
              fullWidth
              onClick={() => setStep('content')}
              disabled={!canProceedFromParticipants}
            >
              Weiter: Inhalt wählen
            </Button>
          </motion.div>
        )}

        {/* Step 2: Content */}
        {step === 'content' && (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Content type selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setContentType('sections')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  contentType === 'sections'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Abschnitte
              </button>
              <button
                onClick={() => setContentType('book')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  contentType === 'book'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Ganzes Buch
              </button>
              <button
                onClick={() => setContentType('topic')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  contentType === 'topic'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Thema
              </button>
            </div>

            {/* Language selection */}
            <Card>
              <CardContent>
                <Select
                  label="Sprache"
                  options={languageOptions}
                  value={targetLanguage}
                  onChange={(e) =>
                    setTargetLanguage(e.target.value as Language)
                  }
                />
              </CardContent>
            </Card>

            {/* Sections selection */}
            {contentType === 'sections' && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Abschnitte auswählen
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => toggleSection(section)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedSections.find((s) => s.id === section.id)
                            ? 'bg-primary-100 border-primary-300 border'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-sm">{section.name}</div>
                        <div className="text-xs text-gray-500">
                          {section.bookName} | {section.wordCount} Wörter
                        </div>
                      </button>
                    ))}
                    {sections.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Keine Abschnitte mit Vokabeln vorhanden.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Book selection */}
            {contentType === 'book' && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Buch auswählen
                  </h3>
                  <div className="space-y-2">
                    {books
                      .filter((b) => b.language === targetLanguage)
                      .map((book) => (
                        <button
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                            selectedBook?.id === book.id
                              ? 'bg-primary-100 border-primary-300 border'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <BookOpen className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{book.name}</div>
                            <div className="text-xs text-gray-500">
                              {book.wordCount} Wörter
                            </div>
                          </div>
                        </button>
                      ))}
                    {books.filter((b) => b.language === targetLanguage)
                      .length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Keine Bücher für diese Sprache vorhanden.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Topic input */}
            {contentType === 'topic' && (
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">
                      Freies Thema
                    </h3>
                  </div>
                  <Input
                    placeholder="z.B. Tiere, Essen, Familie, Verben..."
                    value={topicText}
                    onChange={(e) => setTopicText(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Der KI-Tutor wird passende Fragen zum Thema stellen.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('participants')}>
                Zurück
              </Button>
              <Button
                fullWidth
                onClick={() => setStep('settings')}
                disabled={!canProceedFromContent}
              >
                Weiter: Einstellungen
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Settings */}
        {step === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Sprachlevel
                </h3>
                <div className="space-y-2">
                  {immersionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setImmersionLevel(option.value as ImmersionLevel)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        immersionLevel === option.value
                          ? 'bg-primary-100 border-primary-300 border'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">Tempo</h3>
                <div className="flex gap-2">
                  {timingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimingMode(option.value as TimingMode)}
                      className={`flex-1 text-center px-3 py-3 rounded-lg transition-colors ${
                        timingMode === option.value
                          ? 'bg-primary-100 border-primary-300 border'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Zusammenfassung
                </h3>
                <div className="text-sm space-y-1 text-gray-600">
                  <p>
                    <strong>Spieler:</strong>{' '}
                    {players.map((p) => p.name).join(', ')}
                  </p>
                  {spectators.length > 0 && (
                    <p>
                      <strong>Zuschauer:</strong>{' '}
                      {spectators.map((s) => s.name).join(', ')}
                    </p>
                  )}
                  <p>
                    <strong>Inhalt:</strong>{' '}
                    {contentType === 'sections'
                      ? `${selectedSections.length} Abschnitte`
                      : contentType === 'book'
                        ? selectedBook?.name
                        : `Thema: ${topicText}`}
                  </p>
                  <p>
                    <strong>Sprache:</strong>{' '}
                    {languageOptions.find((l) => l.value === targetLanguage)
                      ?.label || targetLanguage}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('content')}>
                Zurück
              </Button>
              <Button fullWidth onClick={handleStart} disabled={!canStart}>
                <Play className="w-4 h-4 mr-2" />
                Starten
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
