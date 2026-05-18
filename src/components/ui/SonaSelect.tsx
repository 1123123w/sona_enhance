import { useState, useRef, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import '@/styles/SonaSelect.css'

export interface SonaSelectOption {
  value: string
  label: string
  icon?: string
}

export interface SonaSelectProps {
  options: SonaSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SonaSelect({ options, value, onChange, placeholder }: SonaSelectProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="sonaenhance-select" ref={dropdownRef}>
      <button
        className={`sonaenhance-select-trigger${isOpen ? ' sonaenhance-select-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="sonaenhance-select-value">
          {selectedOption?.icon && <img className="sonaenhance-select-icon" src={selectedOption.icon} alt="" />}
          {selectedOption ? selectedOption.label : (placeholder ?? t('select.placeholder'))}
        </span>
        <svg className={`sonaenhance-select-arrow${isOpen ? ' sonaenhance-select-arrow--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="sonaenhance-select-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              className={`sonaenhance-select-option${value === option.value ? ' sonaenhance-select-option--active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              type="button"
            >
              <span className="sonaenhance-select-option-label">
                {option.icon && <img className="sonaenhance-select-icon" src={option.icon} alt="" />}
                {option.label}
              </span>
              {value === option.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
