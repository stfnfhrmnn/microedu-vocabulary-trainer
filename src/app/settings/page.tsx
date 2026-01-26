'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { FamilySetupWizard } from '@/components/network/FamilySetupWizard'
import { JoinNetworkModal } from '@/components/network/JoinNetworkModal'
import { CreateNetworkModal } from '@/components/network/CreateNetworkModal'
import { useSettings } from '@/stores/settings'
import { db } from '@/lib/db/db'
import type { Network } from '@/lib/db/schema'

const directionOptions = [
  { value: 'sourceToTarget', label: 'Deutsch → Fremdsprache' },
  { value: 'targetToSource', label: 'Fremdsprache → Deutsch' },
  { value: 'mixed', label: 'Gemischt' },
]

const exerciseOptions = [
  { value: 'flashcard', label: 'Karteikarten' },
  { value: 'multipleChoice', label: 'Multiple Choice' },
  { value: 'typed', label: 'Eingabe' },
]

const strictnessOptions = [
  { value: 'strict', label: 'Streng (100% korrekt)' },
  { value: 'normal', label: 'Normal (85% korrekt)' },
  { value: 'lenient', label: 'Nachsichtig (70% korrekt)' },
]

const ocrOptions = [
  { value: 'tesseract', label: 'Tesseract (Offline)' },
  { value: 'google-vision', label: 'Google Vision (Online)' },
]

const ttsOptions = [
  { value: 'web-speech', label: 'Web Speech API (Kostenlos)' },
  { value: 'google-cloud', label: 'Google Cloud TTS (Bessere Qualität)' },
]

const googleVoiceOptions = [
  { value: 'wavenet', label: 'WaveNet (Beste Qualität)' },
  { value: 'standard', label: 'Standard (Schneller)' },
]

export default function SettingsPage() {
  const settings = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  // Network modals
  const [showFamilyWizard, setShowFamilyWizard] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [networkSuccess, setNetworkSuccess] = useState<string | null>(null)

  const handleNetworkComplete = (network: Network | null) => {
    if (network) {
      setNetworkSuccess(`Erfolgreich: ${network.name}`)
      setTimeout(() => setNetworkSuccess(null), 3000)
    }
  }

  const handleExport = async () => {
    try {
      const books = await db.books.toArray()
      const chapters = await db.chapters.toArray()
      const sections = await db.sections.toArray()
      const vocabulary = await db.vocabularyItems.toArray()
      const progress = await db.learningProgress.toArray()

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          books,
          chapters,
          sections,
          vocabulary,
          progress,
        },
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vokabeltrainer-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportMessage('Export erfolgreich!')
      setTimeout(() => setExportMessage(null), 3000)
    } catch (error) {
      setExportMessage('Export fehlgeschlagen')
      setTimeout(() => setExportMessage(null), 3000)
    }
  }

  return (
    <PageContainer>
      <Header title="Einstellungen" />

      <div className="space-y-4">
        {/* Network Discovery - Gemeinsam lernen */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Gemeinsam lernen</h3>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Verbinde dich mit Familie, Freunden oder deiner Klasse.
            </p>

            {networkSuccess && (
              <div className="p-3 bg-success-50 text-success-600 text-sm rounded-lg mb-4">
                {networkSuccess}
              </div>
            )}

            <div className="space-y-3">
              {/* Family Setup */}
              <button
                onClick={() => setShowFamilyWizard(true)}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left flex items-center gap-3"
              >
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 block">Familie einrichten</span>
                  <span className="text-sm text-gray-500">Für Eltern und Kinder</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Join Class */}
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left flex items-center gap-3"
              >
                <span className="text-2xl">🏫</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 block">Klasse beitreten</span>
                  <span className="text-sm text-gray-500">Mit Einladungscode</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Create Study Group */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left flex items-center gap-3"
              >
                <span className="text-2xl">📚</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 block">Lerngruppe erstellen</span>
                  <span className="text-sm text-gray-500">Mit Freunden lernen</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Link to Network Overview */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/networks"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Meine Netzwerke verwalten
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Practice Defaults */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Übungs-Voreinstellungen</h3>

            <div className="space-y-4">
              <Select
                label="Standard-Richtung"
                options={directionOptions}
                value={settings.defaultDirection}
                onChange={(e) =>
                  settings.setDefaultDirection(e.target.value as typeof settings.defaultDirection)
                }
              />

              <Select
                label="Standard-Übungsart"
                options={exerciseOptions}
                value={settings.defaultExerciseType}
                onChange={(e) =>
                  settings.setDefaultExerciseType(e.target.value as typeof settings.defaultExerciseType)
                }
              />

              <Select
                label="Tipp-Genauigkeit"
                options={strictnessOptions}
                value={settings.typingStrictness}
                onChange={(e) =>
                  settings.setTypingStrictness(e.target.value as typeof settings.typingStrictness)
                }
                helperText="Wie genau muss die eingetippte Antwort sein?"
              />
            </div>
          </CardContent>
        </Card>

        {/* OCR Settings */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">OCR (Foto-Scan)</h3>

            <div className="space-y-4">
              <Select
                label="OCR-Anbieter"
                options={ocrOptions}
                value={settings.ocrProvider}
                onChange={(e) =>
                  settings.setOcrProvider(e.target.value as typeof settings.ocrProvider)
                }
                helperText="Tesseract funktioniert offline, Google Vision benötigt Internet"
              />

              {settings.ocrProvider === 'google-vision' && (
                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="Google Cloud API-Schlüssel"
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.googleApiKey || ''}
                        onChange={(e) => settings.setGoogleApiKey(e.target.value || null)}
                        placeholder="API-Schlüssel eingeben..."
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? 'Verbergen' : 'Zeigen'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Erstelle einen API-Schlüssel in der{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                    {' '}mit aktivierter Vision API.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Practice Settings */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Sprachübung</h3>

            <div className="space-y-4">
              <Select
                label="Sprachausgabe (TTS)"
                options={ttsOptions}
                value={settings.ttsProvider}
                onChange={(e) =>
                  settings.setTTSProvider(e.target.value as typeof settings.ttsProvider)
                }
                helperText={
                  settings.ttsProvider === 'google-cloud'
                    ? 'Benötigt Google Cloud API-Schlüssel (oben)'
                    : 'Kostenlos, Qualität variiert je nach Browser'
                }
              />

              {settings.ttsProvider === 'google-cloud' && !settings.googleApiKey && (
                <p className="text-sm text-warning-600 bg-warning-50 p-2 rounded">
                  Bitte gib einen Google Cloud API-Schlüssel ein (siehe OCR-Einstellungen oben).
                </p>
              )}

              {settings.ttsProvider === 'google-cloud' && settings.googleApiKey && (
                <Select
                  label="Google Stimmentyp"
                  options={googleVoiceOptions}
                  value={settings.googleVoiceType}
                  onChange={(e) =>
                    settings.setGoogleVoiceType(e.target.value as typeof settings.googleVoiceType)
                  }
                  helperText="WaveNet klingt natürlicher, Standard ist schneller"
                />
              )}

              {/* Voice Speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sprechgeschwindigkeit: {Math.round(settings.ttsRate * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.ttsRate}
                  onChange={(e) => settings.setTTSRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Langsam</span>
                  <span>Normal</span>
                  <span>Schnell</span>
                </div>
              </div>

              {/* Voice Pitch (Web Speech only) */}
              {settings.ttsProvider === 'web-speech' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tonhöhe: {Math.round(settings.ttsPitch * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.ttsPitch}
                    onChange={(e) => settings.setTTSPitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Tief</span>
                    <span>Normal</span>
                    <span>Hoch</span>
                  </div>
                </div>
              )}

              <Toggle
                checked={settings.useAIAnalysis}
                onChange={settings.setUseAIAnalysis}
                label="KI-Analyse"
                description="Nutzt Gemini zur besseren Erkennung gesprochener Antworten"
              />

              {settings.useAIAnalysis && !settings.googleApiKey && (
                <p className="text-sm text-warning-600 bg-warning-50 p-2 rounded">
                  Für KI-Analyse wird ein Google Cloud API-Schlüssel mit aktivierter Gemini API benötigt.
                </p>
              )}

              {settings.useAIAnalysis && settings.googleApiKey && (
                <p className="text-sm text-gray-500">
                  KI-Analyse versteht natürliche Sprache besser und kann auch semantisch ähnliche Antworten erkennen.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">App-Einstellungen</h3>

            <div className="space-y-4">
              <Toggle
                checked={settings.soundEnabled}
                onChange={settings.setSoundEnabled}
                label="Töne"
                description="Akustisches Feedback bei richtig/falsch"
              />

              <Toggle
                checked={settings.hapticEnabled}
                onChange={settings.setHapticEnabled}
                label="Vibration"
                description="Haptisches Feedback auf unterstützten Geräten"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Daten</h3>

            <div className="space-y-4">
              <div>
                <Button variant="outline" fullWidth onClick={handleExport}>
                  Daten exportieren
                </Button>
                {exportMessage && (
                  <p className="text-sm text-center mt-2 text-success-600">{exportMessage}</p>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Alle Daten werden lokal auf deinem Gerät gespeichert.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500">
              Vokabeltrainer v0.1.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Made with 💙 for language learners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Modals */}
      <FamilySetupWizard
        isOpen={showFamilyWizard}
        onClose={() => setShowFamilyWizard(false)}
        onComplete={(network) => {
          setShowFamilyWizard(false)
          handleNetworkComplete(network)
        }}
      />

      <JoinNetworkModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={(network) => {
          setShowJoinModal(false)
          handleNetworkComplete(network)
        }}
      />

      <CreateNetworkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(network) => {
          setShowCreateModal(false)
          handleNetworkComplete(network)
        }}
      />
    </PageContainer>
  )
}
