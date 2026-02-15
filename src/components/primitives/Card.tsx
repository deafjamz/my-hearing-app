import { cn } from '@/lib/utils'

const variantClasses = {
  default: 'bg-slate-900 border border-slate-800 rounded-2xl',
  highlighted: 'bg-teal-500 rounded-2xl shadow-xl',
  subtle: 'bg-slate-900/50 border border-slate-800 rounded-2xl',
} as const

interface CardProps {
  variant?: keyof typeof variantClasses
  padding?: string
  className?: string
  children: React.ReactNode
}

export function Card({
  variant = 'default',
  padding = 'p-6',
  className,
  children,
}: CardProps) {
  return (
    <div className={cn(variantClasses[variant], padding, className)}>
      {children}
    </div>
  )
}
