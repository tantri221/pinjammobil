import React from 'react'
import { cn } from '../../lib/utils'

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children, 
  disabled,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer"
  
  const variants = {
    default: "bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 active:scale-[0.98]",
    secondary: "bg-zinc-100 text-zinc-900 shadow-xs hover:bg-zinc-200/80 active:scale-[0.98]",
    outline: "border border-zinc-200 bg-white shadow-xs hover:bg-zinc-100 hover:text-zinc-900",
    ghost: "hover:bg-zinc-100 hover:text-zinc-900",
    destructive: "bg-red-600 text-white shadow-xs hover:bg-red-700 active:scale-[0.98]"
  }

  const sizes = {
    default: "h-9 px-4 py-2 text-sm rounded-lg",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-11 rounded-lg px-8 text-base",
    icon: "h-9 w-9 rounded-lg"
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
