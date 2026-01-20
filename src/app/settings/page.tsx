'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { useSettings } from '@/stores/settings'
import { db } from '@/lib/db/db'

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

export default function SettingsPage() {
  const settings = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

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
    </PageContainer>
  )
}
