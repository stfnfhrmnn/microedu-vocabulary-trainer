'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { extractTitleFromImage } from '@/lib/ocr/name-extractor'
import type { Language } from '@/lib/db/schema'

type CreationType = 'book' | 'chapter'
type Step = 'capture' | 'processing' | 'review'

interface CreateFromImageModalProps {
  isOpen: boolean
  onClose: () => void
  type: CreationType
  onCreateBook?: (name: string, language: Language, coverColor: string) => Promise<void>
  onCreateChapter?: (name: string) => Promise<void>
  bookId?: string
  bookLanguage?: Language
}

const languageOptions = [
  { value: 'french', label: 'Französisch' },
  { value: 'spanish', label: 'Spanisch' },
  { value: 'latin', label: 'Latein' },
]

const colorOptions = [
  { value: '#3b82f6', label: 'Blau' },
  { value: '#22c55e', label: 'Grün' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Rot' },
  { value: '#8b5cf6', label: 'Lila' },
  { value: '#ec4899', label: 'Pink' },
]

export function CreateFromImageModal({
  isOpen,
  onClose,
  type,
  onCreateBook,
  onCreateChapter,
  bookId,
  bookLanguage,
}: CreateFromImageModalProps) {
  const [step, setStep] = useState<Step>('capture')
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedName, setExtractedName] = useState('')
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Language>(bookLanguage || 'french')
  const [coverColor, setCoverColor] = useState('#3b82f6')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const resetState = useCallback(() => {
    setStep('capture')
    setCapturedImage(null)
    setImagePreview(null)
    setExtractedName('')
    setName('')
    setError(null)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  const processImage = useCallback(async (blob: Blob) => {
    setCapturedImage(blob)
    setImagePreview(URL.createObjectURL(blob))
    setStep('processing')
    setIsProcessing(true)
    setError(null)

    try {
      const result = await extractTitleFromImage(blob, type)

      if (result) {
        setExtractedName(result.title)
        setName(result.title)
      } else {
        setExtractedName('')
        setName('')
      }

      setStep('review')
    } catch (err) {
      setError('Konnte keinen Text erkennen. Bitte versuche es erneut.')
      setStep('capture')
    } finally {
      setIsProcessing(false)
    }
  }, [type])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }, [processImage])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Kamera-Zugriff nicht möglich')
    }
  }, [])

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      canvas.toBlob(blob => {
        if (blob) {
          processImage(blob)
        }
      }, 'image/jpeg', 0.8)
    }

    // Stop camera
    streamRef.current.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [processImage])

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      if (type === 'book' && onCreateBook) {
        await onCreateBook(name.trim(), language, coverColor)
      } else if (type === 'chapter' && onCreateChapter) {
        await onCreateChapter(name.trim())
      }
      handleClose()
    } catch (err) {
      setError('Konnte nicht erstellen. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }, [type, name, language, coverColor, onCreateBook, onCreateChapter, handleClose])

  const handleRetry = useCallback(() => {
    setStep('capture')
    setError(null)
  }, [])

  const title = type === 'book' ? 'Buch aus Bild erstellen' : 'Kapitel aus Bild erstellen'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <AnimatePresence mode="wait">
        {/* Capture Step */}
        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              {type === 'book'
                ? 'Fotografiere das Buchcover oder eine Seite mit dem Titel.'
                : 'Fotografiere die Kapitelüberschrift oder Seite mit dem Kapiteltitel.'}
            </p>

            {error && (
              <div className="p-3 bg-error-50 text-error-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Camera preview */}
            <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/50 rounded-lg w-3/4 h-1/2" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Datei wählen
              </Button>

              <Button
                variant="primary"
                fullWidth
                onClick={streamRef.current ? captureFromCamera : startCamera}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {streamRef.current ? 'Aufnehmen' : 'Kamera starten'}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
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
            className="flex flex-col items-center justify-center py-8"
          >
            {imagePreview && (
              <div className="w-32 h-32 rounded-xl overflow-hidden mb-4 shadow-lg">
                <img
                  src={imagePreview}
                  alt="Erfasstes Bild"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mb-4" />
            <p className="text-gray-600">Erkenne Text...</p>
          </motion.div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Image preview */}
            {imagePreview && (
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Erfasstes Bild"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {extractedName && (
              <div className="p-3 bg-success-50 text-success-700 rounded-lg text-sm">
                Erkannter Titel: <strong>{extractedName}</strong>
              </div>
            )}

            {!extractedName && (
              <div className="p-3 bg-warning-50 text-warning-700 rounded-lg text-sm">
                Kein Titel erkannt. Bitte manuell eingeben.
              </div>
            )}

            <Input
              label="Name"
              placeholder={type === 'book' ? 'z.B. Découvertes 2' : 'z.B. Unité 3'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            {type === 'book' && (
              <>
                <Select
                  label="Sprache"
                  options={languageOptions}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Farbe
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setCoverColor(color.value)}
                        className={`w-10 h-10 rounded-full transition-transform ${
                          coverColor === color.value
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-error-50 text-error-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleRetry}
              >
                Neues Bild
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={isSubmitting}
                disabled={!name.trim()}
                onClick={handleSubmit}
              >
                Erstellen
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
