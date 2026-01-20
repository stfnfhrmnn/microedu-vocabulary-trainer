'use client'

import { motion } from 'framer-motion'
import type { OCRProviderType } from '@/lib/ocr/types'
import { cn } from '@/lib/utils/cn'

type OCRStage = 'initializing' | 'uploading' | 'processing' | 'parsing'

interface OCRProgressProps {
  stage: OCRStage
  provider: OCRProviderType
  progress?: number // 0-100, mainly for Tesseract
  className?: string
}

const STAGE_LABELS: Record<OCRStage, string> = {
  initializing: 'Initialisiere...',
  uploading: 'Lade Bild hoch...',
  processing: 'Erkenne Text...',
  parsing: 'Extrahiere Vokabeln...',
}

const PROVIDER_INFO: Record<OCRProviderType, { label: string; icon: 'online' | 'offline' }> = {
  tesseract: { label: 'Tesseract (offline)', icon: 'offline' },
  'google-vision': { label: 'Google Vision (online)', icon: 'online' },
  gemini: { label: 'Gemini (online)', icon: 'online' },
}

export function OCRProgress({ stage, provider, progress, className }: OCRProgressProps) {
  const providerInfo = PROVIDER_INFO[provider] || PROVIDER_INFO.tesseract
  const showProgress = typeof progress === 'number' && provider === 'tesseract'

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Spinner */}
      <div className="relative w-20 h-20 mb-6">
        {showProgress ? (
          // Progress ring for Tesseract
          <svg className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-primary-500"
              strokeDasharray={226} // 2 * PI * 36
              initial={{ strokeDashoffset: 226 }}
              animate={{ strokeDashoffset: 226 - (226 * (progress || 0)) / 100 }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        ) : (
          // Simple spinner for API-based providers
          <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}

        {/* Progress percentage */}
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-700">
              {Math.round(progress || 0)}%
            </span>
          </div>
        )}
      </div>

      {/* Stage label */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {STAGE_LABELS[stage]}
      </h3>

      {/* Progress bar for Tesseract */}
      {showProgress && (
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-primary-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Provider indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {providerInfo.icon === 'online' ? (
          <span className="w-2 h-2 bg-success-500 rounded-full" />
        ) : (
          <span className="w-2 h-2 bg-gray-400 rounded-full" />
        )}
        <span>{providerInfo.label}</span>
      </div>
    </div>
  )
}

// Provider indicator badge for after processing
interface ProviderBadgeProps {
  provider: OCRProviderType
  className?: string
}

export function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  const providerInfo = PROVIDER_INFO[provider] || PROVIDER_INFO.tesseract
  const isOnline = providerInfo.icon === 'online'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        isOnline
          ? 'bg-success-50 text-success-700'
          : 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {isOnline ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 01-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 01-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.414 1.414 5 5 0 010-7.07 1 1 0 011.414 0zm4.242 0a1 1 0 011.414 0 5 5 0 010 7.072 1 1 0 01-1.414-1.414 3 3 0 000-4.243 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      )}
      <span>{providerInfo.label}</span>
    </div>
  )
}
