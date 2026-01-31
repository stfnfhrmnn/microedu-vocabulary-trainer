/**
 * Family Sharing Service
 *
 * Manages family groups, member relationships, and shared content.
 */

import { db } from '@/lib/db/db'
import { generateId } from '@/lib/utils/id'
import { generateNetworkInviteCode, isValidNetworkInviteCode } from '@/lib/utils/user-id'
import type {
  FamilyGroup,
  FamilyMember,
  SharedBook,
  ProgressShareSettings,
  UserRole,
} from '@/lib/db/schema'

// ============================================================================
// Invite Code Generation
// ============================================================================

/**
 * Generate a unique invite code in XXX-XXX format
 */
function generateInviteCode(): string {
  return generateNetworkInviteCode()
}

function formatInviteCode(code: string): string | null {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length !== 6) return null
  const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return isValidNetworkInviteCode(formatted) ? formatted : null
}

// ============================================================================
// Family Group Management
// ============================================================================

/**
 * Create a new family group
 */
export async function createFamilyGroup(
  name: string,
  creatorUserId: string,
  creatorRole: UserRole = 'parent'
): Promise<FamilyGroup> {
  const group: FamilyGroup = {
    id: generateId(),
    name,
    createdBy: creatorUserId,
    inviteCode: generateInviteCode(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.familyGroups.add(group)

  // Add creator as first member
  await addFamilyMember(group.id, creatorUserId, creatorRole)

  return group
}

/**
 * Get family group by invite code
 */
export async function getFamilyGroupByInviteCode(code: string): Promise<FamilyGroup | undefined> {
  const formatted = formatInviteCode(code)
  if (!formatted) return undefined
  return db.familyGroups.where('inviteCode').equals(formatted).first()
}

/**
 * Get family group by ID
 */
export async function getFamilyGroup(id: string): Promise<FamilyGroup | undefined> {
  return db.familyGroups.get(id)
}

/**
 * Get all family groups a user belongs to
 */
export async function getUserFamilyGroups(userId: string): Promise<FamilyGroup[]> {
  const memberships = await db.familyMembers.where('userId').equals(userId).toArray()
  const groupIds = memberships.map((m) => m.familyId)
  return db.familyGroups.where('id').anyOf(groupIds).toArray()
}

/**
 * Update family group name
 */
export async function updateFamilyGroup(id: string, updates: Partial<Pick<FamilyGroup, 'name'>>): Promise<void> {
  await db.familyGroups.update(id, {
    ...updates,
    updatedAt: new Date(),
  })
}

/**
 * Regenerate invite code for a family group
 */
export async function regenerateInviteCode(groupId: string): Promise<string> {
  const newCode = generateInviteCode()
  await db.familyGroups.update(groupId, {
    inviteCode: newCode,
    updatedAt: new Date(),
  })
  return newCode
}

// ============================================================================
// Family Member Management
// ============================================================================

/**
 * Add a member to a family group
 */
export async function addFamilyMember(
  familyId: string,
  userId: string,
  role: UserRole,
  nickname?: string
): Promise<FamilyMember> {
  // Check if already a member
  const existing = await db.familyMembers
    .where('familyId')
    .equals(familyId)
    .filter((m) => m.userId === userId)
    .first()

  if (existing) {
    throw new Error('User is already a member of this family')
  }

  const member: FamilyMember = {
    id: generateId(),
    familyId,
    userId,
    role,
    nickname,
    joinedAt: new Date(),
  }

  await db.familyMembers.add(member)
  return member
}

/**
 * Join a family using an invite code
 */
export async function joinFamilyByCode(
  inviteCode: string,
  userId: string,
  role: UserRole,
  nickname?: string
): Promise<FamilyMember> {
  const group = await getFamilyGroupByInviteCode(inviteCode)
  if (!group) {
    throw new Error('Ungültiger Einladungscode')
  }

  return addFamilyMember(group.id, userId, role, nickname)
}

/**
 * Get all members of a family group
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  return db.familyMembers.where('familyId').equals(familyId).toArray()
}

/**
 * Get user's membership in a family
 */
export async function getUserMembership(
  familyId: string,
  userId: string
): Promise<FamilyMember | undefined> {
  return db.familyMembers
    .where('familyId')
    .equals(familyId)
    .filter((m) => m.userId === userId)
    .first()
}

/**
 * Update member role or nickname
 */
export async function updateFamilyMember(
  memberId: string,
  updates: Partial<Pick<FamilyMember, 'role' | 'nickname'>>
): Promise<void> {
  await db.familyMembers.update(memberId, updates)
}

/**
 * Remove a member from a family group
 */
export async function removeFamilyMember(memberId: string): Promise<void> {
  await db.familyMembers.delete(memberId)
}

/**
 * Leave a family group
 */
export async function leaveFamilyGroup(familyId: string, userId: string): Promise<void> {
  const membership = await getUserMembership(familyId, userId)
  if (membership) {
    await db.familyMembers.delete(membership.id)
  }
}

// ============================================================================
// Book Sharing
// ============================================================================

/**
 * Share a book with a family group
 */
export async function shareBookWithFamily(
  bookId: string,
  familyId: string,
  sharedByUserId: string,
  permissions: 'view' | 'copy' | 'edit' = 'view'
): Promise<SharedBook> {
  // Check if already shared
  const existing = await db.sharedBooks
    .where('bookId')
    .equals(bookId)
    .filter((s) => s.groupId === familyId)
    .first()

  if (existing) {
    // Update permissions
    await db.sharedBooks.update(existing.id, { permissions })
    return { ...existing, permissions }
  }

  const sharedBook: SharedBook = {
    id: generateId(),
    bookId,
    sharedBy: sharedByUserId,
    sharedWith: 'family',
    groupId: familyId,
    permissions,
    sharedAt: new Date(),
  }

  await db.sharedBooks.add(sharedBook)
  return sharedBook
}

/**
 * Get books shared with a family group
 */
export async function getSharedBooksForFamily(familyId: string): Promise<SharedBook[]> {
  return db.sharedBooks.where('groupId').equals(familyId).toArray()
}

/**
 * Unshare a book
 */
export async function unshareBook(sharedBookId: string): Promise<void> {
  await db.sharedBooks.delete(sharedBookId)
}

/**
 * Copy a shared book to user's library
 */
export async function copySharedBook(
  sharedBookId: string,
  targetUserId: string
): Promise<string> {
  const sharedBook = await db.sharedBooks.get(sharedBookId)
  if (!sharedBook) {
    throw new Error('Shared book not found')
  }

  if (sharedBook.permissions === 'view') {
    throw new Error('No permission to copy this book')
  }

  const originalBook = await db.books.get(sharedBook.bookId)
  if (!originalBook) {
    throw new Error('Original book not found')
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
  for (const chapter of chapters) {
    const newChapterId = generateId()
    await db.chapters.add({
      ...chapter,
      id: newChapterId,
      bookId: newBookId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Copy sections
    const sections = await db.sections.where('chapterId').equals(chapter.id).toArray()
    for (const section of sections) {
      const newSectionId = generateId()
      await db.sections.add({
        ...section,
        id: newSectionId,
        chapterId: newChapterId,
        bookId: newBookId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Copy vocabulary
      const vocabulary = await db.vocabularyItems.where('sectionId').equals(section.id).toArray()
      for (const vocab of vocabulary) {
        await db.vocabularyItems.add({
          ...vocab,
          id: generateId(),
          sectionId: newSectionId,
          chapterId: newChapterId,
          bookId: newBookId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }
  }

  return newBookId
}

// ============================================================================
// Progress Sharing
// ============================================================================

/**
 * Set up progress sharing between child and parent
 */
export async function setProgressSharing(
  childUserId: string,
  parentUserId: string,
  settings: {
    shareProgress?: boolean
    shareStreak?: boolean
    shareWeakWords?: boolean
  }
): Promise<ProgressShareSettings> {
  const existing = await db.progressShareSettings
    .where('userId')
    .equals(childUserId)
    .filter((s) => s.sharedWithId === parentUserId)
    .first()

  if (existing) {
    await db.progressShareSettings.update(existing.id, {
      ...settings,
      updatedAt: new Date(),
    })
    return { ...existing, ...settings, updatedAt: new Date() }
  }

  const newSettings: ProgressShareSettings = {
    id: generateId(),
    userId: childUserId,
    sharedWithId: parentUserId,
    shareProgress: settings.shareProgress ?? true,
    shareStreak: settings.shareStreak ?? true,
    shareWeakWords: settings.shareWeakWords ?? false,
    updatedAt: new Date(),
  }

  await db.progressShareSettings.add(newSettings)
  return newSettings
}

/**
 * Get progress sharing settings for a child
 */
export async function getProgressSharingSettings(
  childUserId: string,
  parentUserId: string
): Promise<ProgressShareSettings | undefined> {
  return db.progressShareSettings
    .where('userId')
    .equals(childUserId)
    .filter((s) => s.sharedWithId === parentUserId)
    .first()
}

/**
 * Get all children whose progress is shared with a parent
 */
export async function getSharedProgressChildren(
  parentUserId: string
): Promise<ProgressShareSettings[]> {
  return db.progressShareSettings.where('sharedWithId').equals(parentUserId).toArray()
}

/**
 * Remove progress sharing
 */
export async function removeProgressSharing(settingsId: string): Promise<void> {
  await db.progressShareSettings.delete(settingsId)
}
