import { useEffect, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { getChampionById } from '@/lib/assets'
import '@/styles/CounterRecommendationModal.css'

export interface CounterRecommendationItem {
  championId: number
  score: number
  matchups: Array<{
    enemyId: number
    enemyWinRate: number
    play: number
  }>
}

export interface CounterRecommendationModalProps {
  open: boolean
  onClose: () => void
  enemyChampionId: number
  enemyLane: string
  suggestions: CounterRecommendationItem[]
  state: 'loading' | 'ready' | 'error'
  message?: string
}

function getChampionName(championId: number): string {
  const champion = getChampionById(championId)
  return champion ? `${champion.title}${champion.name ? ` ${champion.name}` : ''}` : `英雄${championId}`
}

function getChampionIcon(championId: number): string {
  return `/lol-game-data/assets/v1/champion-icons/${championId}.png`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function CounterRecommendationModal({
  open,
  onClose,
  enemyChampionId,
  enemyLane,
  suggestions,
  state,
  message,
}: CounterRecommendationModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const enemyName = enemyChampionId > 0 ? getChampionName(enemyChampionId) : '对方英雄'

  const stopLayerEvent = (event: SyntheticEvent) => {
    event.stopPropagation()
  }

  return createPortal(
    <div
      className="scrm-backdrop"
      data-sonaenhance-counter-modal="true"
      onMouseDownCapture={(event) => {
        event.stopPropagation()
        if (event.target === event.currentTarget) onClose()
      }}
      onClick={stopLayerEvent}
    >
      <div className="scrm-panel" onMouseDown={stopLayerEvent} onClick={stopLayerEvent}>
        <button type="button" className="scrm-close" onClick={onClose} aria-label="关闭 Counter 推荐">
          ×
        </button>
        <div className="scrm">
        <header className="scrm-header">
          <div className="scrm-enemy">
            {enemyChampionId > 0 && <img src={getChampionIcon(enemyChampionId)} alt="" />}
            <div>
              <div className="scrm-title">{enemyName}</div>
              <div className="scrm-subtitle">{enemyLane} Counter 推荐 · OP.GG KR ranked</div>
            </div>
          </div>
        </header>

        <div className="scrm-list">
          {state === 'loading' ? (
            <div className="scrm-empty">正在加载 OP.GG counter 数据...</div>
          ) : state === 'error' ? (
            <div className="scrm-empty scrm-empty--warning">{message || 'OP.GG counter 数据请求失败'}</div>
          ) : suggestions.length === 0 ? (
            <div className="scrm-empty">{message || 'OP.GG 暂无该英雄的可用 counter 推荐'}</div>
          ) : suggestions.map((suggestion, index) => {
            const matchup = suggestion.matchups
              .filter((item) => item.enemyId === enemyChampionId)
              .sort((left, right) => left.enemyWinRate - right.enemyWinRate)[0]
              ?? suggestion.matchups.sort((left, right) => left.enemyWinRate - right.enemyWinRate)[0]
            return (
              <div className="scrm-row" key={suggestion.championId}>
                <div className="scrm-rank">#{index + 1}</div>
                <img className="scrm-icon" src={getChampionIcon(suggestion.championId)} alt="" />
                <div className="scrm-main">
                  <div className="scrm-name">{getChampionName(suggestion.championId)}</div>
                  <div className="scrm-meta">
                    对方胜率 {matchup ? formatPercent(matchup.enemyWinRate) : '-'} · {matchup?.play ?? 0} 场
                  </div>
                </div>
                <div className="scrm-score">
                  <span>{formatPercent(Math.max(0, Math.min(1, suggestion.score)))}</span>
                  <small>压制</small>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>,
    document.body,
  )
}
