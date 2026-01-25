'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GroupVoiceSessionView } from '@/components/practice/GroupVoiceSessionView'
import { useGroupVoiceSession } from '@/stores/group-voice-session'

export default function GroupSessionPage() {
  const router = useRouter()
  const { status, players, startSession } = useGroupVoiceSession()

  // Start session on mount if not already started
  useEffect(() => {
    if (status === 'setup' && players.length >= 2) {
      startSession()
    } else if (status === 'idle' || players.length < 2) {
      // Not properly initialized, go back to setup
      router.replace('/practice/group')
    }
  }, [status, players, startSession, router])

  const handleSessionComplete = () => {
    router.push('/practice/group/summary')
  }

  // Don't render until session is active
  if (status !== 'active' && status !== 'waiting' && status !== 'processing' && status !== 'summary' && status !== 'paused') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-lg">Wird geladen...</div>
      </div>
    )
  }

  return <GroupVoiceSessionView onSessionComplete={handleSessionComplete} />
}
