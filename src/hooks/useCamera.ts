'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unavailable'

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  permission: CameraPermission
  isStreaming: boolean
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  captureFrame: () => Promise<Blob | null>
}

/**
 * Hook for camera access and frame capture
 */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [permission, setPermission] = useState<CameraPermission>('prompt')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check camera availability on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setPermission('unavailable')
      return
    }

    // Check current permission status
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((status) => {
        setPermission(status.state as CameraPermission)
        status.onchange = () => {
          setPermission(status.state as CameraPermission)
        }
      })
      .catch(() => {
        // Permissions API not supported, will check on stream request
      })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Kamera wird von diesem Gerät nicht unterstützt')
      setPermission('unavailable')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      streamRef.current = stream
      setPermission('granted')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kamera konnte nicht gestartet werden'

      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setPermission('denied')
        setError('Kamerazugriff wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen.')
      } else if (message.includes('NotFoundError')) {
        setPermission('unavailable')
        setError('Keine Kamera gefunden')
      } else {
        setError(message)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
  }, [])

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || !isStreaming) {
      return null
    }

    // Create canvas matching video dimensions
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return null
    }

    // Draw current video frame
    ctx.drawImage(video, 0, 0)

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.9 // High quality for OCR
      )
    })
  }, [isStreaming])

  return {
    videoRef,
    permission,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  }
}
