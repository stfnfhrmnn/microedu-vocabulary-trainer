'use client'

import { motion } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { ProgressRing } from '@/components/progress/ProgressRing'
import { useVocabularyStats } from '@/lib/db/hooks/useDueWords'
import { useReviewSessions, useTodayReviewCount } from '@/lib/db/hooks/useProgress'
import { useBooks } from '@/lib/db/hooks/useBooks'
import { formatDate } from '@/lib/utils/date'

export default function ProgressPage() {
  const { stats, isLoading: statsLoading } = useVocabularyStats()
  const { sessions } = useReviewSessions(5)
  const todayCount = useTodayReviewCount()
  const { books } = useBooks()

  const isLoading = statsLoading

  const masteryPercentage = stats
    ? stats.total > 0
      ? Math.round((stats.mastered / stats.total) * 100)
      : 0
    : 0

  return (
    <PageContainer>
      <Header title="Dein Fortschritt" />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !stats || stats.total === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Statistiken</h3>
            <p className="text-gray-500">
              Füge Vokabeln hinzu und beginne zu üben um deinen Fortschritt zu sehen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Mastery Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Gesamt-Fortschritt</h3>
                    <p className="text-sm text-gray-500">{stats.total} Vokabeln</p>
                  </div>
                  <ProgressRing
                    percentage={masteryPercentage}
                    size={100}
                    strokeWidth={8}
                    color="#22c55e"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {masteryPercentage}%
                      </div>
                      <div className="text-xs text-gray-500">Gelernt</div>
                    </div>
                  </ProgressRing>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">Vokabel-Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Neu</span>
                      <span className="font-medium">{stats.new}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.new / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Lernend</span>
                      <span className="font-medium text-warning-600">{stats.learning}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning-400 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.learning / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Gelernt</span>
                      <span className="font-medium text-success-600">{stats.mastered}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Heute geübt</h3>
                    <p className="text-sm text-gray-500">
                      {stats.dueToday} noch fällig
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary-600">{todayCount}</div>
                    <div className="text-sm text-gray-500">Vokabeln</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Per-Book Stats */}
          {books.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Nach Buch
              </h3>
              <div className="space-y-2">
                {books.map((book) => (
                  <Card key={book.id}>
                    <CardContent className="flex items-center gap-3">
                      <div
                        className="w-3 h-10 rounded-full"
                        style={{ backgroundColor: book.coverColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{book.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Letzte Übungen
              </h3>
              <Card>
                <CardContent padding="sm">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className={`py-3 flex items-center justify-between ${
                        index < sessions.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.totalItems} Vokabeln
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success-600">
                          {session.completedAt
                            ? `${session.correctCount}/${session.totalItems}`
                            : 'Abgebrochen'}
                        </p>
                        {session.completedAt && (
                          <p className="text-xs text-gray-500">
                            {Math.round((session.correctCount / session.totalItems) * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
