'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, MoreVertical, UserX, Shield, Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '@/lib/db/schema'

interface Member {
  id: string
  userId: string
  role: UserRole
  nickname: string
  avatar: string
  visibility: string
  joinedAt: string
  isMe: boolean
}

interface MemberListProps {
  networkId: string
  members: Member[]
  currentUserId: string
  isAdmin: boolean
  onRemoveMember?: (memberId: string) => void
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void
}

export function MemberList({
  networkId,
  members,
  currentUserId,
  isAdmin,
  onRemoveMember,
  onUpdateMember,
}: MemberListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'child': return 'Schüler'
      case 'parent': return 'Eltern'
      case 'teacher': return 'Lehrer'
      case 'admin': return 'Admin'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-600'
      case 'teacher': return 'bg-blue-500/20 text-blue-600'
      case 'parent': return 'bg-green-500/20 text-green-600'
      case 'child': return 'bg-yellow-500/20 text-yellow-600'
      default: return 'bg-gray-500/20 text-gray-600'
    }
  }

  const competitors = members.filter((m) => m.role === 'child')
  const supporters = members.filter((m) => m.role !== 'child')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" />
        Mitglieder ({members.length})
      </h2>

      {/* Competitors */}
      {competitors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Schüler ({competitors.length})
          </h3>
          <div className="space-y-2">
            {competitors.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                isAdmin={isAdmin}
                isMenuOpen={menuOpenId === member.id}
                onMenuToggle={() => setMenuOpenId(menuOpenId === member.id ? null : member.id)}
                onRemove={() => onRemoveMember?.(member.id)}
                onUpdate={(updates) => onUpdateMember?.(member.id, updates)}
                getRoleLabel={getRoleLabel}
                getRoleBadgeColor={getRoleBadgeColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Supporters */}
      {supporters.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Unterstützer ({supporters.length})
          </h3>
          <div className="space-y-2">
            {supporters.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                isAdmin={isAdmin}
                isMenuOpen={menuOpenId === member.id}
                onMenuToggle={() => setMenuOpenId(menuOpenId === member.id ? null : member.id)}
                onRemove={() => onRemoveMember?.(member.id)}
                onUpdate={(updates) => onUpdateMember?.(member.id, updates)}
                getRoleLabel={getRoleLabel}
                getRoleBadgeColor={getRoleBadgeColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MemberCardProps {
  member: Member
  index: number
  isAdmin: boolean
  isMenuOpen: boolean
  onMenuToggle: () => void
  onRemove: () => void
  onUpdate: (updates: Partial<Member>) => void
  getRoleLabel: (role: UserRole) => string
  getRoleBadgeColor: (role: UserRole) => string
}

function MemberCard({
  member,
  index,
  isAdmin,
  isMenuOpen,
  onMenuToggle,
  onRemove,
  onUpdate,
  getRoleLabel,
  getRoleBadgeColor,
}: MemberCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`p-3 rounded-xl flex items-center gap-3 ${
        member.isMe ? 'bg-primary/5 border border-primary/20' : 'bg-card border'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
        {member.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {member.nickname}
            {member.isMe && <span className="text-primary ml-1">(Du)</span>}
          </span>
          {member.visibility === 'hidden' && (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(member.role)}`}>
          {getRoleLabel(member.role)}
        </span>
      </div>

      {/* Menu */}
      {(isAdmin || member.isMe) && (
        <div className="relative">
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-10 overflow-hidden"
              >
                {member.isMe && (
                  <button
                    onClick={() => {
                      onUpdate({ visibility: member.visibility === 'visible' ? 'hidden' : 'visible' })
                      onMenuToggle()
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                  >
                    {member.visibility === 'visible' ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Verstecken
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Sichtbar machen
                      </>
                    )}
                  </button>
                )}
                {isAdmin && !member.isMe && (
                  <>
                    <button
                      onClick={() => {
                        onUpdate({ role: member.role === 'admin' ? 'child' : 'admin' })
                        onMenuToggle()
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      {member.role === 'admin' ? 'Admin entfernen' : 'Zum Admin machen'}
                    </button>
                    <button
                      onClick={() => {
                        onRemove()
                        onMenuToggle()
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Entfernen
                    </button>
                  </>
                )}
                {member.isMe && (
                  <button
                    onClick={() => {
                      onRemove()
                      onMenuToggle()
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Verlassen
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
