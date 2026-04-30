import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'

// ==================== 自动接受对局 ====================

const AUTO_ACCEPT_MAX_DELAY_MS = 15000

let autoAcceptUnsub: (() => void) | null = null
/** 记录当次 ReadyCheck 已调度的定时器，phase 离开 ReadyCheck 要清掉防止误触 */
let autoAcceptTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 计算本次 accept 的延迟毫秒数：
 *   - minMs / maxMs 任一不是有限数、负数、或 max > 15000 → 视为无延迟（秒接）
 *   - min > max → 非法，秒接
 *   - min === max → 固定延迟
 *   - 否则 [min, max] 闭区间随机
 *
 * 这里严格校验：哪怕是"玩家手滑输了 99999"这种也不会真睡那么久，直接秒接兜底。
 */
function computeAcceptDelayMs(): number {
  const minMs = store.get('autoAcceptDelayMin')
  const maxMs = store.get('autoAcceptDelayMax')

  const isValidRange =
    Number.isFinite(minMs) && Number.isFinite(maxMs) &&
    minMs >= 0 && maxMs >= 0 &&
    maxMs <= AUTO_ACCEPT_MAX_DELAY_MS &&
    minMs <= maxMs &&
    maxMs > 0  // 全 0 = 用户没配 = 秒接

  if (!isValidRange) return 0

  // [min, max] 均匀随机
  return Math.round(minMs + Math.random() * (maxMs - minMs))
}

function scheduleAcceptMatch() {
  // 清理可能残留的上次调度（防御性）
  if (autoAcceptTimer) {
    clearTimeout(autoAcceptTimer)
    autoAcceptTimer = null
  }

  const delayMs = computeAcceptDelayMs()

  const doAccept = () => {
    autoAcceptTimer = null
    lcu.acceptMatch()
      .then(() => logger.info('Auto accepted match ✓ (delay=%dms)', delayMs))
      .catch((err) => logger.error('Auto accept failed:', err))
  }

  if (delayMs === 0) {
    doAccept()
  } else {
    logger.info('[AutoAccept] 随机延迟 %dms 后接受', delayMs)
    autoAcceptTimer = setTimeout(doAccept, delayMs)
  }
}

export function updateAutoAccept(enabled: boolean) {
  if (enabled && !autoAcceptUnsub) {
    autoAcceptUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ReadyCheck') {
        scheduleAcceptMatch()
      } else if (autoAcceptTimer) {
        // ReadyCheck 窗口关闭（玩家手动拒绝 / 自动超时 / 队友拒绝）时清掉定时器，
        // 避免我们稍后的 accept 在"下一次 ReadyCheck 到来前"误触
        clearTimeout(autoAcceptTimer)
        autoAcceptTimer = null
      }
    })
    logger.info('Auto accept enabled ✓')
  } else if (!enabled && autoAcceptUnsub) {
    autoAcceptUnsub()
    autoAcceptUnsub = null
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer)
      autoAcceptTimer = null
    }
    logger.info('Auto accept disabled')
  }
}
