'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { PronunciationButton } from './PronunciationButton'
import { cn } from '@/lib/utils/cn'
import type { VocabularyItem, Language } from '@/lib/db/schema'

interface Props {
  vocabulary: VocabularyItem
  language: Language
  showDetails?: boolean
  onToggleDetails?: () => void
  className?: string
}

const wordTypeLabels: Record<string, string> = {
  noun: 'Nomen',
  verb: 'Verb',
  adjective: 'Adjektiv',
  adverb: 'Adverb',
  preposition: 'Präposition',
  conjunction: 'Konjunktion',
  pronoun: 'Pronomen',
  phrase: 'Redewendung',
  other: 'Sonstiges',
}

const genderLabels: Record<string, string> = {
  masculine: 'm',
  feminine: 'f',
  neuter: 'n',
  common: 'c',
}

const genderColors: Record<string, string> = {
  masculine: 'bg-blue-100 text-blue-700',
  feminine: 'bg-pink-100 text-pink-700',
  neuter: 'bg-gray-100 text-gray-700',
  common: 'bg-purple-100 text-purple-700',
}

const tenseLabels: Record<string, string> = {
  present: 'Präsens',
  past: 'Präteritum',
  perfect: 'Perfekt',
  future: 'Futur',
  imperfect: 'Imperfekt',
  conditional: 'Konditional',
  subjunctive: 'Konjunktiv',
  imperative: 'Imperativ',
}

const personLabels: Record<string, string> = {
  '1s': 'ich',
  '2s': 'du',
  '3s': 'er/sie',
  '1p': 'wir',
  '2p': 'ihr',
  '3p': 'sie',
}

export function VocabularyDetailCard({
  vocabulary,
  language,
  showDetails = false,
  onToggleDetails,
  className,
}: Props) {
  const [activeTab, setActiveTab] = useState<'examples' | 'conjugation' | 'hints'>('examples')

  const hasExamples = vocabulary.examples && vocabulary.examples.length > 0
  const hasConjugations = vocabulary.conjugations && vocabulary.conjugations.length > 0
  const hasHints = vocabulary.hints && vocabulary.hints.length > 0
  const hasEtymology = !!vocabulary.etymology
  const hasExpandedContent = hasExamples || hasConjugations || hasHints || hasEtymology

  return (
    <Card className={className}>
      <CardContent>
        {/* Main vocabulary display */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Source text (German) */}
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-gray-900">{vocabulary.sourceText}</p>
              <PronunciationButton
                text={vocabulary.sourceText}
                language="german"
                size="sm"
                variant="ghost"
              />
            </div>

            {/* Target text (Foreign language) */}
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-primary-600">{vocabulary.targetText}</p>
              <PronunciationButton
                text={vocabulary.targetText}
                language={language}
                size="sm"
                variant="ghost"
              />
              {vocabulary.gender && (
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  genderColors[vocabulary.gender]
                )}>
                  {genderLabels[vocabulary.gender]}
                </span>
              )}
            </div>

            {/* Word type and plural */}
            <div className="flex items-center gap-2 mt-1">
              {vocabulary.wordType && (
                <span className="text-xs text-gray-500">
                  {wordTypeLabels[vocabulary.wordType]}
                </span>
              )}
              {vocabulary.plural && (
                <span className="text-xs text-gray-400">
                  Pl: {vocabulary.plural}
                </span>
              )}
            </div>

            {/* Pronunciation hint */}
            {vocabulary.pronunciation && (
              <p className="text-xs text-gray-400 mt-1 italic">
                [{vocabulary.pronunciation}]
              </p>
            )}
          </div>

          {/* Expand button */}
          {hasExpandedContent && (
            <button
              onClick={onToggleDetails}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={cn(
                  'w-5 h-5 transition-transform',
                  showDetails && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Notes */}
        {vocabulary.notes && (
          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">
            {vocabulary.notes}
          </p>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {showDetails && hasExpandedContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                {/* Tab navigation */}
                <div className="flex gap-2 mb-3">
                  {hasExamples && (
                    <button
                      onClick={() => setActiveTab('examples')}
                      className={cn(
                        'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
                        activeTab === 'examples'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      Beispiele
                    </button>
                  )}
                  {hasConjugations && (
                    <button
                      onClick={() => setActiveTab('conjugation')}
                      className={cn(
                        'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
                        activeTab === 'conjugation'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      Konjugation
                    </button>
                  )}
                  {hasHints && (
                    <button
                      onClick={() => setActiveTab('hints')}
                      className={cn(
                        'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
                        activeTab === 'hints'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      Hinweise
                    </button>
                  )}
                </div>

                {/* Tab content */}
                {activeTab === 'examples' && hasExamples && (
                  <div className="space-y-2">
                    {vocabulary.examples!.map((example, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-gray-800 flex-1">{example.text}</p>
                          <PronunciationButton
                            text={example.text}
                            language={language}
                            size="sm"
                            variant="ghost"
                          />
                        </div>
                        {example.translation && (
                          <p className="text-xs text-gray-500 mt-1">{example.translation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'conjugation' && hasConjugations && (
                  <div className="space-y-3">
                    {vocabulary.conjugations!.map((conj, idx) => (
                      <div key={idx}>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {tenseLabels[conj.tense] || conj.tense}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {conj.forms.map((form, fidx) => (
                            <div key={fidx} className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400 w-12">
                                {personLabels[form.person]}
                              </span>
                              <span className="text-gray-900">{form.form}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'hints' && hasHints && (
                  <div className="space-y-2">
                    {vocabulary.hints!.map((hint, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-400 uppercase w-8">
                          {hint.language.slice(0, 2)}
                        </span>
                        <p className="text-sm text-gray-700">{hint.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Etymology (always visible when details are shown) */}
                {hasEtymology && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Wortherkunft</p>
                    <p className="text-sm text-gray-600 italic">{vocabulary.etymology}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
