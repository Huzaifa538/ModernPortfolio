import clsx from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
}

/** A plain on/off switch with an accessible button role. */
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300',
        'disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2',
        checked ? 'bg-gradient-to-r from-[#6366f1] to-[#22d3ee]' : 'bg-[var(--surface2)]'
      )}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
