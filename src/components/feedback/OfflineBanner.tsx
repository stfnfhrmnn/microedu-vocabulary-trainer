'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useOnline } from '@/hooks/useOnline'

export function OfflineBanner() {
  const { isOnline } = useOnline()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 bg-warning-100 border-b border-warning-200 px-4 py-2 text-center"
        >
          <p className="text-sm text-warning-800 font-medium">
            Du bist offline. Alle Funktionen sind weiterhin verfügbar!
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
