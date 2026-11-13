import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Modal({ isOpen, onClose, title, description, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className={cn(
        "relative w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 z-10 max-h-[90vh] overflow-y-auto",
        maxWidth
      )}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="mb-5 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
          {description && (
            <p className="text-xs text-zinc-500">{description}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
