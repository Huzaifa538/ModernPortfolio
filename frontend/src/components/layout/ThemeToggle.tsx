import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative rounded-full border border-[var(--border)] bg-[var(--glass)] p-2.5 text-[var(--muted)] backdrop-blur transition-all duration-300 hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]"
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  )
}
