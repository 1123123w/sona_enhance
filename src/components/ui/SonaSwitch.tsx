import '@/styles/SonaSwitch.css'

export interface SonaSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SonaSwitch({ checked, onChange, disabled = false }: SonaSwitchProps) {
  return (
    <button
      className={`sonaenhance-switch${checked ? ' sonaenhance-switch--on' : ''}${disabled ? ' sonaenhance-switch--disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
    >
      <span className="sonaenhance-switch-thumb" />
    </button>
  )
}
