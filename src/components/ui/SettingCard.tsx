import type { ReactNode } from 'react'
import '@/styles/SettingCard.css'

export interface SettingCardProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingCard({ title, description, children }: SettingCardProps) {
  return (
    <div className="sonaenhance-setting-card">
      <div className="sonaenhance-setting-card-info">
        <h4 className="sonaenhance-setting-card-title">{title}</h4>
        {description && (
          <p className="sonaenhance-setting-card-desc">{description}</p>
        )}
      </div>
      <div className="sonaenhance-setting-card-action">
        {children}
      </div>
    </div>
  )
}

export interface SettingGroupProps {
  title: string
  children: ReactNode
}

export function SettingGroup({ title, children }: SettingGroupProps) {
  return (
    <div className="sonaenhance-setting-group">
      <h3 className="sonaenhance-setting-group-title">{title}</h3>
      <div className="sonaenhance-setting-group-list">
        {children}
      </div>
    </div>
  )
}
