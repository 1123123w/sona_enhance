import type { CSSProperties, ReactNode } from 'react'
import '@/styles/SonaButton.css'

export interface SonaButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  disabled?: boolean
  style?: CSSProperties
}

export function SonaButton({ children, variant = 'primary', onClick, disabled = false, style }: SonaButtonProps) {
  return (
    <button
      className={`sonaenhance-btn sonaenhance-btn--${variant}${disabled ? ' sonaenhance-btn--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      type="button"
    >
      <span className="sonaenhance-btn-shine" />
      {children}
    </button>
  )
}
