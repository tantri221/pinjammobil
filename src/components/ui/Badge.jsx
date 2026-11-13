import React from 'react'
import { cn } from '../../lib/utils'

export function Badge({ className, variant = 'default', children, ...props }) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
  
  const variants = {
    default: "border-transparent bg-zinc-900 text-zinc-50",
    secondary: "border-transparent bg-zinc-100 text-zinc-900",
    outline: "text-zinc-950 border-zinc-200",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700"
  }

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  )
}
