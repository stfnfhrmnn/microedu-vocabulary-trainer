'use client'

import { cn } from '@/lib/utils/cn'

interface CodeFormatHintProps {
  context: 'network' | 'account'
  className?: string
}

export function CodeFormatHint({ context, className }: CodeFormatHintProps) {
  if (context === 'account') {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Geräte-Code: <span className="font-mono">XXXX-XXXX</span>. Nicht der Netzwerkcode{' '}
        <span className="font-mono">XXX-XXX</span>.
      </p>
    )
  }

  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Netzwerkcode: <span className="font-mono">XXX-XXX</span>. Nicht der Geräte-Code{' '}
      <span className="font-mono">XXXX-XXXX</span>.
    </p>
  )
}
