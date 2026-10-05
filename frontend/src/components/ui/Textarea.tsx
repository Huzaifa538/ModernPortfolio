import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

/** Multiline field with the same floating-label treatment as Input. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, ...rest },
  ref
) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <div>
      <div className="relative">
        <textarea
          ref={ref}
          id={fieldId}
          placeholder=" "
          rows={5}
          className={clsx(
            'peer min-h-[140px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 pb-2.5 pt-6',
            'text-[var(--text)] placeholder-transparent transition-all duration-300',
            'focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30',
            'disabled:opacity-60',
            error && 'border-red-500/60 focus:border-red-400 focus:ring-red-400/30',
            className
          )}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        <label
          htmlFor={fieldId}
          className="pointer-events-none absolute left-4 top-4 origin-left text-sm text-[var(--muted)] transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3.5 peer-focus:scale-[0.8] peer-focus:text-[#8b5cf6] peer-[:not(:placeholder-shown)]:-translate-y-3.5 peer-[:not(:placeholder-shown)]:scale-[0.8]"
        >
          {label}
        </label>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
})
