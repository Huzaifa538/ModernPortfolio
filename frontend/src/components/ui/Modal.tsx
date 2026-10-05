import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  wide?: boolean
}

/**
 * Accessible modal: ESC + overlay click close, scroll lock,
 * and focus moves to the dialog when it opens.
 */
export function Modal({ open, onClose, children, title, wide = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Move focus into the dialog on open
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 40)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Dialog'}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`glass relative max-h-[90vh] w-full overflow-y-auto rounded-2xl p-6 sm:p-8 ${
              wide ? 'max-w-4xl' : 'max-w-lg'
            }`}
          >
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            >
              <X className="h-5 w-5" />
            </button>
            {title && (
              <h3 className="font-display mb-5 pr-10 text-xl font-bold sm:text-2xl">{title}</h3>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
