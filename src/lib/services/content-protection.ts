/**
 * Content Protection Service
 *
 * Manages deletion protection, ownership verification, and content moderation.
 * Protects high-practice items and ensures data integrity.
 */

import { db } from '@/lib/db/db'
import { generateId } from '@/lib/utils/id'
import type {
  DeletionRequest,
  DeletionStatus,
  UserBlock,
  ContentReport,
  ReportType,
  ReportStatus,
  BlockType,
} from '@/lib/db/schema'

// ============================================================================
// Deletion Protection
// ============================================================================

export interface DeletionProtectionResult {
  canDelete: boolean
  requiresConfirmation: boolean
  requiresParentApproval: boolean
  totalReviews: number
  isCopied: boolean
  message?: string
}

/**
 * Check if an item can be deleted and what protection level applies
 */
export async function checkDeletionProtection(
  itemType: 'vocabulary' | 'book' | 'chapter' | 'section',
  itemId: string,
  userId: string,
  isChild: boolean
): Promise<DeletionProtectionResult> {
  let totalReviews = 0
  let isCopied = false

  if (itemType === 'vocabulary') {
    // Check learning progress for this vocabulary item
    const progress = await db.learningProgress
      .where('vocabularyId')
      .equals(itemId)
      .first()
    totalReviews = progress?.totalReviews || 0

    // Check if this vocabulary is from a copied book
    const vocab = await db.vocabularyItems.get(itemId)
    if (vocab) {
      const bookCopy = await db.bookCopies
        .where('copiedBookId')
        .equals(vocab.bookId)
        .first()
      isCopied = !!bookCopy
    }
  } else if (itemType === 'book') {
    // Sum up all reviews for items in this book
    const vocabItems = await db.vocabularyItems.where('bookId').equals(itemId).toArray()
    const vocabIds = vocabItems.map((v) => v.id)

    if (vocabIds.length > 0) {
      const progressRecords = await db.learningProgress
        .where('vocabularyId')
        .anyOf(vocabIds)
        .toArray()
      totalReviews = progressRecords.reduce((sum, p) => sum + (p.totalReviews || 0), 0)
    }

    // Check if this is a copied book
    const bookCopy = await db.bookCopies
      .where('copiedBookId')
      .equals(itemId)
      .first()
    isCopied = !!bookCopy
  } else if (itemType === 'chapter') {
    // Sum up reviews for items in this chapter
    const vocabItems = await db.vocabularyItems.where('chapterId').equals(itemId).toArray()
    const vocabIds = vocabItems.map((v) => v.id)

    if (vocabIds.length > 0) {
      const progressRecords = await db.learningProgress
        .where('vocabularyId')
        .anyOf(vocabIds)
        .toArray()
      totalReviews = progressRecords.reduce((sum, p) => sum + (p.totalReviews || 0), 0)
    }
  } else if (itemType === 'section') {
    // Sum up reviews for items in this section
    const vocabItems = await db.vocabularyItems.where('sectionId').equals(itemId).toArray()
    const vocabIds = vocabItems.map((v) => v.id)

    if (vocabIds.length > 0) {
      const progressRecords = await db.learningProgress
        .where('vocabularyId')
        .anyOf(vocabIds)
        .toArray()
      totalReviews = progressRecords.reduce((sum, p) => sum + (p.totalReviews || 0), 0)
    }
  }

  // Cannot delete items from copied books (read-only)
  if (isCopied) {
    return {
      canDelete: false,
      requiresConfirmation: false,
      requiresParentApproval: false,
      totalReviews,
      isCopied: true,
      message: 'Kopierte Inhalte können nicht bearbeitet werden',
    }
  }

  // Determine protection level based on total reviews
  const requiresConfirmation = totalReviews >= 10
  const requiresParentApproval = isChild && totalReviews >= 10

  let message: string | undefined
  if (totalReviews >= 50) {
    message = `Dieser Inhalt wurde ${totalReviews} mal geübt. Bitte bestätige die Löschung durch Eingabe von "LÖSCHEN".`
  } else if (totalReviews >= 10) {
    message = `Dieser Inhalt wurde ${totalReviews} mal geübt. Möchtest du wirklich fortfahren?`
  }

  return {
    canDelete: true,
    requiresConfirmation,
    requiresParentApproval,
    totalReviews,
    isCopied: false,
    message,
  }
}

/**
 * Create a deletion request for protected content
 */
export async function createDeletionRequest(
  userId: string,
  itemType: 'vocabulary' | 'book' | 'chapter' | 'section',
  itemId: string,
  totalReviews: number,
  requiresConfirmation: boolean
): Promise<DeletionRequest> {
  const request: DeletionRequest = {
    id: generateId(),
    userId,
    itemType,
    itemId,
    totalReviews,
    requiresConfirmation,
    status: 'pending',
    createdAt: new Date(),
  }

  await db.deletionRequests.add(request)
  return request
}

/**
 * Confirm a deletion request (by parent)
 */
export async function confirmDeletionRequest(
  requestId: string,
  confirmedBy: string
): Promise<void> {
  await db.deletionRequests.update(requestId, {
    status: 'confirmed',
    confirmedBy,
  })
}

/**
 * Reject a deletion request
 */
export async function rejectDeletionRequest(requestId: string): Promise<void> {
  await db.deletionRequests.update(requestId, {
    status: 'rejected',
  })
}

/**
 * Get pending deletion requests for a parent to review
 */
export async function getPendingDeletionRequests(
  parentUserId: string
): Promise<DeletionRequest[]> {
  // In a real implementation, this would check parent-child relationships
  return db.deletionRequests
    .where('status')
    .equals('pending')
    .toArray()
}

// ============================================================================
// User Blocking
// ============================================================================

/**
 * Block a user
 */
export async function blockUser(
  blockerId: string,
  blockedId: string,
  blockType: BlockType = 'full'
): Promise<UserBlock> {
  // Check if already blocked
  const existing = await db.userBlocks
    .where('blockerId')
    .equals(blockerId)
    .filter((b) => b.blockedId === blockedId)
    .first()

  if (existing) {
    throw new Error('Benutzer bereits blockiert')
  }

  const block: UserBlock = {
    id: generateId(),
    blockerId,
    blockedId,
    blockType,
    createdAt: new Date(),
  }

  await db.userBlocks.add(block)
  return block
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const block = await db.userBlocks
    .where('blockerId')
    .equals(blockerId)
    .filter((b) => b.blockedId === blockedId)
    .first()

  if (block) {
    await db.userBlocks.delete(block.id)
  }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(
  userId: string,
  targetUserId: string
): Promise<boolean> {
  const block = await db.userBlocks
    .where('blockerId')
    .equals(userId)
    .filter((b) => b.blockedId === targetUserId)
    .first()

  return !!block
}

/**
 * Check if blocked by another user (mutual check)
 */
export async function isBlockedBy(
  userId: string,
  targetUserId: string
): Promise<boolean> {
  return isUserBlocked(targetUserId, userId)
}

/**
 * Get all users blocked by a user
 */
export async function getBlockedUsers(userId: string): Promise<UserBlock[]> {
  return db.userBlocks.where('blockerId').equals(userId).toArray()
}

// ============================================================================
// Content Reporting
// ============================================================================

/**
 * Report content or user
 */
export async function reportContent(
  reporterId: string,
  reportType: ReportType,
  options: {
    reportedUserId?: string
    reportedBookId?: string
    networkId?: string
    description?: string
  }
): Promise<ContentReport> {
  const report: ContentReport = {
    id: generateId(),
    reporterId,
    reportType,
    reportedUserId: options.reportedUserId,
    reportedBookId: options.reportedBookId,
    networkId: options.networkId,
    description: options.description,
    status: 'pending',
    createdAt: new Date(),
  }

  await db.contentReports.add(report)
  return report
}

/**
 * Get pending reports for a network admin
 */
export async function getNetworkReports(
  networkId: string,
  status?: ReportStatus
): Promise<ContentReport[]> {
  let query = db.contentReports.where('networkId').equals(networkId)

  if (status) {
    query = query.filter((r) => r.status === status)
  }

  return query.toArray()
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  await db.contentReports.update(reportId, { status })
}

// ============================================================================
// Ownership Checks
// ============================================================================

/**
 * Check if user owns a book
 */
export async function isBookOwner(bookId: string, userId: string): Promise<boolean> {
  // Check if it's a copied book
  const copy = await db.bookCopies
    .where('copiedBookId')
    .equals(bookId)
    .first()

  if (copy) {
    // For copied books, the copier is the owner
    return copy.copiedBy === userId
  }

  // For original books, check the network shared books
  const sharedBook = await db.networkSharedBooks
    .where('bookId')
    .equals(bookId)
    .first()

  if (sharedBook) {
    return sharedBook.ownerId === userId
  }

  // Default: allow if no sharing info found (local book)
  return true
}

/**
 * Check if user can edit a vocabulary item
 */
export async function canEditVocabulary(
  vocabId: string,
  userId: string
): Promise<boolean> {
  const vocab = await db.vocabularyItems.get(vocabId)
  if (!vocab) return false

  // Check if from copied book
  const copy = await db.bookCopies
    .where('copiedBookId')
    .equals(vocab.bookId)
    .first()

  // Cannot edit items from copied books (read-only)
  if (copy && copy.copiedBy !== userId) {
    return false
  }

  return true
}
