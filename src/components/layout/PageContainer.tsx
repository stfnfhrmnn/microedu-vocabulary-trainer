'use client'

import { cn } from '@/lib/utils/cn'

export interface PageContainerProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  noBottomPadding?: boolean
}

export function PageContainer({
  children,
  className,
  noPadding = false,
  noBottomPadding = false,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'min-h-screen bg-gray-50',
        !noPadding && 'px-4 pt-4',
        !noBottomPadding && 'pb-24',
        className
      )}
      style={{
        paddingTop: noPadding ? undefined : 'max(1rem, env(safe-area-inset-top))',
        paddingLeft: noPadding ? undefined : 'max(1rem, env(safe-area-inset-left))',
        paddingRight: noPadding ? undefined : 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      {children}
    </main>
  )
}
