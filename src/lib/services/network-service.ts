/**
 * Network Service
 *
 * Manages networks (classes/study groups), memberships, and related operations.
 * Networks allow users to compete, share books, and track progress together.
 */

import { db } from '@/lib/db/db'
import { generateId } from '@/lib/utils/id'
import { generateNetworkInviteCode, isValidNetworkInviteCode } from '@/lib/utils/user-id'
import type {
  Network,
  NetworkMember,
  NetworkSharedBook,
  BookCopy,
  UserRole,
  NetworkType,
  NetworkSettings,
  MemberVisibility,
  LeaderboardEntry,
  CompetitionStats,
  PeriodType,
} from '@/lib/db/schema'

// ============================================================================
// Invite Code Generation
// ============================================================================

function formatInviteCode(code: string): string | null {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length !== 6) return null
  const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return isValidNetworkInviteCode(formatted) ? formatted : null
}

// ============================================================================
// Network Management
// ============================================================================

/**
 * Create a new network
 */
export async function createNetwork(
  name: string,
  type: NetworkType,
  ownerId: string,
  ownerRole: UserRole = 'teacher',
  settings: NetworkSettings = {}
): Promise<Network> {
  const network: Network = {
    id: generateId(),
    name,
    type,
    inviteCode: generateNetworkInviteCode(),
    ownerId,
    settings,
    createdAt: new Date(),
  }

  await db.networks.add(network)

  // Add owner as first member
  await addNetworkMember(network.id, ownerId, ownerRole)

  return network
}

/**
 * Get network by invite code
 */
export async function getNetworkByInviteCode(code: string): Promise<Network | undefined> {
  const formatted = formatInviteCode(code)
  if (!formatted) return undefined

  return db.networks
    .where('inviteCode')
    .equals(formatted)
    .first()
}

/**
 * Get network by ID
 */
export async function getNetwork(id: string): Promise<Network | undefined> {
  return db.networks.get(id)
}

/**
 * Get all networks a user belongs to
 */
export async function getUserNetworks(userId: string): Promise<Network[]> {
  const memberships = await db.networkMembers
    .where('userId')
    .equals(userId)
    .filter((m) => m.joinStatus === 'active')
    .toArray()

  const networkIds = memberships.map((m) => m.networkId)
  if (networkIds.length === 0) return []

  return db.networks
    .where('id')
    .anyOf(networkIds)
    .filter((n) => !n.archivedAt)
    .toArray()
}

/**
 * Update network settings
 */
export async function updateNetwork(
  id: string,
  updates: Partial<Pick<Network, 'name' | 'settings'>>
): Promise<void> {
  await db.networks.update(id, updates)
}

/**
 * Archive a network (soft delete)
 */
export async function archiveNetwork(id: string): Promise<void> {
  await db.networks.update(id, { archivedAt: new Date() })
}

/**
 * Regenerate invite code
 */
export async function regenerateNetworkInviteCode(networkId: string): Promise<string> {
  const newCode = generateNetworkInviteCode()
  await db.networks.update(networkId, { inviteCode: newCode })
  return newCode
}

// ============================================================================
// Network Member Management
// ============================================================================

/**
 * Add a member to a network
 */
export async function addNetworkMember(
  networkId: string,
  userId: string,
  role: UserRole,
  nickname?: string,
  visibility: MemberVisibility = 'visible'
): Promise<NetworkMember> {
  // Check if already a member
  const existing = await db.networkMembers
    .where('networkId')
    .equals(networkId)
    .filter((m) => m.userId === userId)
    .first()

  if (existing) {
    throw new Error('Benutzer ist bereits Mitglied dieses Netzwerks')
  }

  const member: NetworkMember = {
    id: generateId(),
    networkId,
    userId,
    role,
    nickname,
    visibility,
    joinStatus: 'active',
    joinedAt: new Date(),
  }

  await db.networkMembers.add(member)
  return member
}

/**
 * Join a network using invite code
 */
export async function joinNetworkByCode(
  inviteCode: string,
  userId: string,
  role: UserRole,
  nickname?: string
): Promise<NetworkMember> {
  const network = await getNetworkByInviteCode(inviteCode)
  if (!network) {
    throw new Error('Ungültiger Einladungscode')
  }

  if (network.archivedAt) {
    throw new Error('Dieses Netzwerk wurde archiviert')
  }

  return addNetworkMember(network.id, userId, role, nickname)
}

/**
 * Get all members of a network
 */
export async function getNetworkMembers(networkId: string): Promise<NetworkMember[]> {
  return db.networkMembers
    .where('networkId')
    .equals(networkId)
    .filter((m) => m.joinStatus === 'active')
    .toArray()
}

/**
 * Get user's membership in a network
 */
export async function getUserNetworkMembership(
  networkId: string,
  userId: string
): Promise<NetworkMember | undefined> {
  return db.networkMembers
    .where('networkId')
    .equals(networkId)
    .filter((m) => m.userId === userId)
    .first()
}

/**
 * Update member details (role, nickname, visibility)
 */
export async function updateNetworkMember(
  memberId: string,
  updates: Partial<Pick<NetworkMember, 'role' | 'nickname' | 'visibility' | 'joinStatus'>>
): Promise<void> {
  await db.networkMembers.update(memberId, updates)
}

/**
 * Remove a member from a network
 */
export async function removeNetworkMember(memberId: string): Promise<void> {
  await db.networkMembers.delete(memberId)
}

/**
 * Leave a network
 */
export async function leaveNetwork(networkId: string, userId: string): Promise<void> {
  const membership = await getUserNetworkMembership(networkId, userId)
  if (membership) {
    await db.networkMembers.delete(membership.id)
  }
}

/**
 * Check if user has permission in network
 */
export async function hasNetworkPermission(
  networkId: string,
  userId: string,
  requiredRoles: UserRole[]
): Promise<boolean> {
  const membership = await getUserNetworkMembership(networkId, userId)
  if (!membership) return false
  return requiredRoles.includes(membership.role)
}

// ============================================================================
// Network Book Sharing
// ============================================================================

/**
 * Share a book with a network
 */
export async function shareBookWithNetwork(
  bookId: string,
  networkId: string,
  ownerId: string
): Promise<NetworkSharedBook> {
  // Check if already shared
  const existing = await db.networkSharedBooks
    .where('bookId')
    .equals(bookId)
    .filter((s) => s.networkId === networkId)
    .first()

  if (existing) {
    throw new Error('Dieses Buch ist bereits mit diesem Netzwerk geteilt')
  }

  const sharedBook: NetworkSharedBook = {
    id: generateId(),
    bookId,
    ownerId,
    networkId,
    permissions: 'copy',
    copyCount: 0,
    sharedAt: new Date(),
  }

  await db.networkSharedBooks.add(sharedBook)
  return sharedBook
}

/**
 * Get books shared with a network
 */
export async function getNetworkSharedBooks(networkId: string): Promise<NetworkSharedBook[]> {
  return db.networkSharedBooks.where('networkId').equals(networkId).toArray()
}

/**
 * Unshare a book from a network
 */
export async function unshareBookFromNetwork(sharedBookId: string): Promise<void> {
  await db.networkSharedBooks.delete(sharedBookId)
}

/**
 * Copy a shared book to user's library
 */
export async function copyNetworkSharedBook(
  sharedBookId: string,
  targetUserId: string
): Promise<string> {
  const sharedBook = await db.networkSharedBooks.get(sharedBookId)
  if (!sharedBook) {
    throw new Error('Geteiltes Buch nicht gefunden')
  }

  const originalBook = await db.books.get(sharedBook.bookId)
  if (!originalBook) {
    throw new Error('Originalbuch nicht gefunden')
  }

  // Create a copy of the book
  const newBookId = generateId()
  await db.books.add({
    ...originalBook,
    id: newBookId,
    name: `${originalBook.name} (Kopie)`,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Copy chapters
  const chapters = await db.chapters.where('bookId').equals(sharedBook.bookId).toArray()
  const chapterIdMap = new Map<string, string>()

  for (const chapter of chapters) {
    const newChapterId = generateId()
    chapterIdMap.set(chapter.id, newChapterId)
    await db.chapters.add({
      ...chapter,
      id: newChapterId,
      bookId: newBookId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Copy sections
  const sections = await db.sections.where('bookId').equals(sharedBook.bookId).toArray()
  const sectionIdMap = new Map<string, string>()

  for (const section of sections) {
    const newSectionId = generateId()
    sectionIdMap.set(section.id, newSectionId)
    const newChapterId = chapterIdMap.get(section.chapterId) || section.chapterId
    await db.sections.add({
      ...section,
      id: newSectionId,
      chapterId: newChapterId,
      bookId: newBookId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Copy vocabulary items
  const vocabItems = await db.vocabularyItems.where('bookId').equals(sharedBook.bookId).toArray()
  for (const vocab of vocabItems) {
    const newSectionId = vocab.sectionId ? sectionIdMap.get(vocab.sectionId) : null
    const newChapterId = vocab.chapterId ? chapterIdMap.get(vocab.chapterId) : null
    await db.vocabularyItems.add({
      ...vocab,
      id: generateId(),
      sectionId: newSectionId || null,
      chapterId: newChapterId || null,
      bookId: newBookId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Track the copy
  const bookCopy: BookCopy = {
    id: generateId(),
    originalBookId: sharedBook.bookId,
    copiedBookId: newBookId,
    copiedBy: targetUserId,
    copiedFromUserId: sharedBook.ownerId,
    copiedAt: new Date(),
  }
  await db.bookCopies.add(bookCopy)

  // Increment copy count
  await db.networkSharedBooks.update(sharedBookId, {
    copyCount: (sharedBook.copyCount || 0) + 1,
  })

  return newBookId
}

/**
 * Check if a book is a copy
 */
export async function isBookCopy(bookId: string): Promise<boolean> {
  const copy = await db.bookCopies
    .where('copiedBookId')
    .equals(bookId)
    .first()
  return !!copy
}

/**
 * Get book copy info
 */
export async function getBookCopyInfo(bookId: string): Promise<BookCopy | undefined> {
  return db.bookCopies
    .where('copiedBookId')
    .equals(bookId)
    .first()
}

// ============================================================================
// Competition Stats
// ============================================================================

/**
 * Get the start date for a period
 */
function getPeriodStart(periodType: PeriodType): Date {
  const now = new Date()
  switch (periodType) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly':
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday start
      return new Date(now.getFullYear(), now.getMonth(), diff)
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'all_time':
      return new Date(0)
  }
}

/**
 * Get or create competition stats for a user and period
 */
export async function getOrCreateCompetitionStats(
  userId: string,
  periodType: PeriodType
): Promise<CompetitionStats> {
  const periodStart = getPeriodStart(periodType)

  const existing = await db.competitionStats
    .where('userId')
    .equals(userId)
    .filter((s) => s.periodType === periodType && s.periodStart.getTime() === periodStart.getTime())
    .first()

  if (existing) return existing

  const stats: CompetitionStats = {
    id: generateId(),
    userId,
    periodType,
    periodStart,
    wordsReviewed: 0,
    wordsMastered: 0,
    accuracyPercentage: 0,
    xpEarned: 0,
    streakDays: 0,
    sessionsCompleted: 0,
    updatedAt: new Date(),
  }

  await db.competitionStats.add(stats)
  return stats
}

/**
 * Update competition stats after a practice session
 */
export async function updateCompetitionStats(
  userId: string,
  sessionStats: {
    wordsReviewed: number
    wordsMastered: number
    correctCount: number
    totalCount: number
    xpEarned: number
    streakDays: number
  }
): Promise<void> {
  const periods: PeriodType[] = ['daily', 'weekly', 'monthly', 'all_time']

  for (const periodType of periods) {
    const stats = await getOrCreateCompetitionStats(userId, periodType)

    const newWordsReviewed = stats.wordsReviewed + sessionStats.wordsReviewed
    const newWordsMastered = stats.wordsMastered + sessionStats.wordsMastered
    const newXp = stats.xpEarned + sessionStats.xpEarned
    const newSessions = stats.sessionsCompleted + 1

    // Calculate rolling accuracy
    const previousTotal = stats.wordsReviewed
    const previousCorrect = Math.round(previousTotal * stats.accuracyPercentage / 100)
    const newTotal = previousTotal + sessionStats.totalCount
    const newCorrect = previousCorrect + sessionStats.correctCount
    const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0

    await db.competitionStats.update(stats.id, {
      wordsReviewed: newWordsReviewed,
      wordsMastered: newWordsMastered,
      accuracyPercentage: Math.round(newAccuracy * 100) / 100,
      xpEarned: newXp,
      streakDays: sessionStats.streakDays,
      sessionsCompleted: newSessions,
      updatedAt: new Date(),
    })
  }
}

/**
 * Get leaderboard for a network
 */
export async function getNetworkLeaderboard(
  networkId: string,
  periodType: PeriodType
): Promise<LeaderboardEntry[]> {
  const members = await getNetworkMembers(networkId)
  const periodStart = getPeriodStart(periodType)

  const entries: LeaderboardEntry[] = []

  for (const member of members) {
    if (member.visibility === 'hidden') continue

    const stats = await db.competitionStats
      .where('userId')
      .equals(member.userId)
      .filter((s) => s.periodType === periodType && s.periodStart.getTime() === periodStart.getTime())
      .first()

    entries.push({
      userId: member.userId,
      nickname: member.nickname || 'Anonym',
      role: member.role,
      rank: 0, // Will be set after sorting
      xpEarned: stats?.xpEarned || 0,
      wordsReviewed: stats?.wordsReviewed || 0,
      wordsMastered: stats?.wordsMastered || 0,
      accuracyPercentage: stats?.accuracyPercentage || 0,
      streakDays: stats?.streakDays || 0,
    })
  }

  // Sort by XP and assign ranks
  entries.sort((a, b) => b.xpEarned - a.xpEarned)

  // Separate kids from parents/teachers for ranking
  const kids = entries.filter((e) => e.role === 'child')
  const supporters = entries.filter((e) => e.role !== 'child')

  kids.forEach((entry, index) => {
    entry.rank = index + 1
  })

  // Return kids first, then supporters (unranked)
  return [...kids, ...supporters]
}

/**
 * Get user's rank across all their networks
 */
export async function getUserNetworkRanks(
  userId: string,
  periodType: PeriodType
): Promise<Array<{ networkId: string; networkName: string; rank: number; totalMembers: number }>> {
  const networks = await getUserNetworks(userId)
  const ranks: Array<{ networkId: string; networkName: string; rank: number; totalMembers: number }> = []

  for (const network of networks) {
    const leaderboard = await getNetworkLeaderboard(network.id, periodType)
    const userEntry = leaderboard.find((e) => e.userId === userId)
    const kidsCount = leaderboard.filter((e) => e.role === 'child').length

    if (userEntry && userEntry.rank > 0) {
      ranks.push({
        networkId: network.id,
        networkName: network.name,
        rank: userEntry.rank,
        totalMembers: kidsCount,
      })
    }
  }

  return ranks
}
