'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { cn } from '@/lib/utils/cn'

interface Step {
  icon: string
  text: string
}

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  steps?: Step[]
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  steps,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'bg-white rounded-2xl border border-gray-200 p-6 text-center',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <motion.div
          variants={itemVariants}
          className="text-5xl mb-4"
        >
          {icon}
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={itemVariants}
          className="text-gray-500 text-sm mb-4"
        >
          {description}
        </motion.p>
      )}

      {/* Steps */}
      {steps && steps.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-gray-50 rounded-xl p-4 mb-6 text-left"
        >
          <div className="space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3"
              >
                <span className="text-2xl">{step.icon}</span>
                <span className="text-sm text-gray-700">{step.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          variants={itemVariants}
          className="space-y-2"
        >
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button variant="primary" fullWidth>
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" fullWidth onClick={action.onClick}>
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button variant="ghost" fullWidth>
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" fullWidth onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
