'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Trophy,
  Users,
  Eye,
  Flame,
  Heart,
  BookOpen,
  RotateCcw,
  Home,
  TrendingUp,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useGroupVoiceSession } from '@/stores/group-voice-session'

export default function GroupSummaryPage() {
  const router = useRouter()
  const { players, spectators, difficultWords, startedAt, questionsAsked, reset } =
    useGroupVoiceSession()

  // Redirect if no session data
  useEffect(() => {
    if (players.length === 0) {
      router.replace('/practice/group')
    }
  }, [players, router])

  // Calculate stats
  const stats = useMemo(() => {
    const totalCorrect = players.reduce((sum, p) => sum + p.correctAnswers, 0)
    const totalAnswered = players.reduce(
      (sum, p) => sum + p.questionsAnswered,
      0
    )
    const teamAccuracy =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
    const totalHintsGiven =
      players.reduce((sum, p) => sum + p.hintsGiven, 0) +
      spectators.reduce((sum, s) => sum + s.hintsGiven, 0)
    const duration = startedAt
      ? Math.round((Date.now() - startedAt.getTime()) / 60000)
      : 0

    // Sort players by correct answers
    const rankedPlayers = [...players].sort(
      (a, b) => b.correctAnswers - a.correctAnswers
    )

    return {
      totalCorrect,
      totalAnswered,
      teamAccuracy,
      totalHintsGiven,
      duration,
      rankedPlayers,
    }
  }, [players, spectators, startedAt])

  const handlePlayAgain = () => {
    reset()
    router.push('/practice/group')
  }

  const handleGoHome = () => {
    reset()
    router.push('/')
  }

  if (players.length === 0) {
    return null
  }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-gray-900">Gut gemacht!</h1>
        <p className="text-gray-600">
          {stats.duration} Minuten | {questionsAsked} Fragen
        </p>
      </motion.div>

      {/* Team stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8" />
                <div>
                  <div className="text-sm opacity-80">Team-Ergebnis</div>
                  <div className="text-2xl font-bold">
                    {stats.totalCorrect}/{stats.totalAnswered}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{stats.teamAccuracy}%</div>
                <div className="text-sm opacity-80">richtig</div>
              </div>
            </div>
            {stats.totalHintsGiven > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4" />
                <span>{stats.totalHintsGiven}x gegenseitig geholfen</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Player results */}
      <div className="space-y-3 mb-4">
        {stats.rankedPlayers.map((player, index) => {
          const accuracy =
            player.questionsAnswered > 0
              ? Math.round(
                  (player.correctAnswers / player.questionsAnswered) * 100
                )
              : 0

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                              ? 'bg-gray-100 text-gray-600'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {index === 0
                          ? '🥇'
                          : index === 1
                            ? '🥈'
                            : index === 2
                              ? '🥉'
                              : index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {player.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {player.correctAnswers}/{player.questionsAnswered}{' '}
                          richtig ({accuracy}%)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {player.maxStreak >= 3 && (
                        <div className="flex items-center gap-1 text-orange-500 text-sm">
                          <Flame className="w-4 h-4" />
                          <span>{player.maxStreak}</span>
                        </div>
                      )}
                      {player.hintsGiven > 0 && (
                        <div className="flex items-center gap-1 text-pink-500 text-sm">
                          <Heart className="w-4 h-4" />
                          <span>{player.hintsGiven}x geholfen</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${accuracy}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Spectators who helped */}
      {spectators.filter((s) => s.hintsGiven > 0).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-4">
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Zuschauer</h3>
              </div>
              <div className="space-y-2">
                {spectators
                  .filter((s) => s.hintsGiven > 0)
                  .map((spectator) => (
                    <div
                      key={spectator.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{spectator.name}</span>
                      <span className="flex items-center gap-1 text-pink-500">
                        <Heart className="w-3 h-3" />
                        {spectator.hintsGiven} Tipps
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Difficult words */}
      {difficultWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="mb-4">
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">
                  Zum Wiederholen
                </h3>
              </div>
              <div className="space-y-2">
                {difficultWords.slice(0, 5).map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm bg-orange-50 rounded-lg px-3 py-2"
                  >
                    <span className="font-medium text-orange-900">
                      {word.word}
                    </span>
                    <span className="text-orange-700">{word.translation}</span>
                  </div>
                ))}
              </div>
              {difficultWords.length > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  +{difficultWords.length - 5} weitere
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3"
      >
        <Button variant="outline" fullWidth onClick={handleGoHome}>
          <Home className="w-4 h-4 mr-2" />
          Startseite
        </Button>
        <Button fullWidth onClick={handlePlayAgain}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Nochmal
        </Button>
      </motion.div>
    </PageContainer>
  )
}
