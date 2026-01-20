'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useCamera } from '@/hooks/useCamera'
import { Button } from '@/components/ui/Button'

interface CameraCaptureProps {
  onCapture: (image: Blob) => void
  onFileSelect?: (file: File) => void
}

export function CameraCapture({ onCapture, onFileSelect }: CameraCaptureProps) {
  const { videoRef, permission, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start camera on mount
  useEffect(() => {
    if (permission !== 'denied' && permission !== 'unavailable') {
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [permission, startCamera, stopCamera])

  const handleCapture = async () => {
    const blob = await captureFrame()
    if (blob) {
      onCapture(blob)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    } else if (file) {
      // Convert file to blob
      onCapture(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // Permission denied or unavailable
  if (permission === 'denied' || permission === 'unavailable') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {permission === 'denied' ? 'Kamerazugriff verweigert' : 'Keine Kamera verfügbar'}
        </h3>

        <p className="text-gray-600 text-center mb-6 max-w-xs">
          {permission === 'denied'
            ? 'Bitte erlaube den Kamerazugriff in deinen Browsereinstellungen.'
            : 'Du kannst stattdessen ein Bild aus deiner Galerie auswählen.'}
        </p>

        <Button variant="primary" onClick={openFilePicker}>
          Bild auswählen
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  // Error state
  if (error && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-error-50 rounded-2xl min-h-[400px]">
        <p className="text-error-700 text-center mb-4">{error}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={startCamera}>
            Erneut versuchen
          </Button>
          <Button variant="primary" onClick={openFilePicker}>
            Bild auswählen
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {/* Video preview */}
      <video
        ref={videoRef}
        className="w-full aspect-[3/4] object-cover"
        playsInline
        muted
      />

      {/* Loading overlay */}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white text-sm">Kamera wird gestartet...</p>
          </div>
        </div>
      )}

      {/* Scanning guide overlay */}
      {isStreaming && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner guides */}
          <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 border-white rounded-tl-lg opacity-70" />
          <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 border-white rounded-tr-lg opacity-70" />
          <div className="absolute bottom-24 left-8 w-12 h-12 border-l-4 border-b-4 border-white rounded-bl-lg opacity-70" />
          <div className="absolute bottom-24 right-8 w-12 h-12 border-r-4 border-b-4 border-white rounded-br-lg opacity-70" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Gallery button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={openFilePicker}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            aria-label="Bild aus Galerie auswählen"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </motion.button>

          {/* Capture button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCapture}
            disabled={!isStreaming}
            className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center disabled:opacity-50"
            aria-label="Foto aufnehmen"
          >
            <div className="w-14 h-14 rounded-full border-4 border-gray-300" />
          </motion.button>

          {/* Spacer for symmetry */}
          <div className="w-12 h-12" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
