import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn("rounded-xl border border-zinc-200/80 bg-white text-zinc-950 shadow-xs", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("font-semibold leading-none tracking-tight text-zinc-900", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-xs text-zinc-500", className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center p-5 pt-0", className)} {...props}>
      {children}
    </div>
  )
}
