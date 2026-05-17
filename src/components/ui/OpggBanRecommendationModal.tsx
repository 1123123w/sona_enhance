import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { getChampionById } from '@/lib/assets'
import { type OpggPosition, type OpggTier } from '@/lib/opgg-api'
import '@/styles/OpggBanRecommendationModal.css'

export interface BanRecommendationItem {
  championId: number
  banRate: number
  pickRate: number
  winRate: number
}

export interface BanRecommendationModalProps {
  open: boolean
  state: 'loading' | 'ready' | 'error'
  message?: string
  selectedTier: OpggTier
  tierOptions: Array<{ value: OpggTier; label: string; icon?: string }>
  recommendations: Record<RankedBanLane, BanRecommendationItem[]>
  onTierChange: (tier: OpggTier) => void
  onClose: () => void
}

export type RankedBanLane = 'top' | 'jungle' | 'mid' | 'adc' | 'support'

const LANE_OPTIONS: Array<{ value: RankedBanLane; label: string }> = [
  { value: 'top', label: '上路' },
  { value: 'jungle', label: '打野' },
  { value: 'mid', label: '中路' },
  { value: 'adc', label: '下路' },
  { value: 'support', label: '辅助' },
]

export function OpggBanRecommendationModal({
  open,
  state,
  message,
  selectedTier,
  tierOptions,
  recommendations,
  onTierChange,
  onClose,
}: BanRecommendationModalProps) {
  const [lane, setLane] = useState<RankedBanLane>('mid')

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const laneItems = recommendations[lane] ?? []

  return createPortal(
    <div className="sbrm-backdrop" onMouseDown={onClose}>
      <div className="sbrm" onMouseDown={(event) => event.stopPropagation()}>
        <header className="sbrm-header">
          <div>
            <div className="sbrm-title">Ban 推荐</div>
            <div className="sbrm-subtitle">OP.GG KR ranked · Ban 率前 10</div>
          </div>
          <div className="sbrm-actions">
            <div className="sbrm-tier">
              <SonaSelect
                value={selectedTier}
                onChange={(next) => onTierChange(next as OpggTier)}
                options={tierOptions}
              />
            </div>
            <button type="button" className="sbrm-close" onClick={onClose} aria-label="关闭 Ban 推荐">
              ×
            </button>
          </div>
        </header>

        <div className="sbrm-tabs">
          {LANE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`sbrm-tab${lane === option.value ? ' sbrm-tab--active' : ''}`}
              onClick={() => setLane(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <main className="sbrm-body">
          {state === 'loading' && <div className="sbrm-empty">正在加载 OP.GG KR Ban 数据...</div>}
          {state === 'error' && <div className="sbrm-empty sbrm-empty--warning">{message || 'OP.GG Ban 数据请求失败'}</div>}
          {state === 'ready' && laneItems.length === 0 && <div className="sbrm-empty">暂无该分路的 Ban 推荐数据。</div>}
          {state === 'ready' && laneItems.length > 0 && (
            <div className="sbrm-list">
              {laneItems.map((item, index) => (
                <BanRow key={`${lane}-${item.championId}`} item={item} rank={index + 1} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>,
    document.body,
  )
}

function BanRow({ item, rank }: { item: BanRecommendationItem; rank: number }) {
  const champion = getChampionById(item.championId)
  const championName = champion ? `${champion.title}${champion.name ? ` ${champion.name}` : ''}` : `英雄 ${item.championId}`

  return (
    <div className="sbrm-row">
      <div className="sbrm-rank">{rank}</div>
      <img className="sbrm-icon" src={`/lol-game-data/assets/v1/champion-icons/${item.championId}.png`} alt="" />
      <div className="sbrm-info">
        <div className="sbrm-name">{championName}</div>
        <div className="sbrm-meta">选取 {formatRate(item.pickRate)} · 胜率 {formatRate(item.winRate)}</div>
      </div>
      <div className="sbrm-rate">
        <span>{formatRate(item.banRate)}</span>
        <small>Ban</small>
      </div>
    </div>
  )
}

function formatRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '-'
  const normalized = value <= 1 ? value * 100 : value
  return `${normalized.toFixed(1)}%`
}
