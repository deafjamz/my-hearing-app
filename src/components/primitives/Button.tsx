import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { hapticSelection } from '@/lib/haptics'

const variantClasses = {
  primary: 'bg-teal-500 hover:bg-teal-400 text-white font-bold transition-colors',
  secondary: 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold transition-colors',
  ghost: 'bg-transparent text-slate-400 hover:text-slate-300 transition-colors',
} as const

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'w-full py-5 text-lg rounded-full',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      hapticSelection()
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        onClick={handleClick}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
