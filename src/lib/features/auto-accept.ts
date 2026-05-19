import { logger } from '@/index'
import { SETTING_KEYS, store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { DelayTask, type TaskSignal } from '@/lib/cancellable-task'

// ==================== 自动接受对局 ====================

const AUTO_ACCEPT_MAX_DELAY_MS = 15000
const READY_CHECK_POLL_INTERVAL_MS = 200

let autoAcceptUnsub: (() => void) | null = null
let readyCheckPollTimer: ReturnType<typeof setInterval> | null = null
const autoAcceptTask = new DelayTask()
let activeAutoAcceptSignal: TaskSignal | null = null

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
  const minMs = store.get(SETTING_KEYS.autoAcceptDelayMin)
  const maxMs = store.get(SETTING_KEYS.autoAcceptDelayMax)

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

function clearAutoAcceptTimer() {
  autoAcceptTask.cancel()
  activeAutoAcceptSignal = null

  if (readyCheckPollTimer) {
    clearInterval(readyCheckPollTimer)
    readyCheckPollTimer = null
  }
}

async function isReadyCheckAcceptable(): Promise<boolean> {
  try {
    const readyCheck = await lcu.getReadyCheck()
    return readyCheck.state === 'InProgress' && readyCheck.playerResponse === 'None'
  } catch (err) {
    logger.warn('[AutoAccept] ReadyCheck 状态检查失败，取消本次自动接受: %o', err)
    return false
  }
}

function startReadyCheckPolling(signal: TaskSignal) {
  if (readyCheckPollTimer) {
    clearInterval(readyCheckPollTimer)
    readyCheckPollTimer = null
  }

  readyCheckPollTimer = setInterval(() => {
    if (signal.cancelled) return

    lcu.getReadyCheck()
      .then((readyCheck) => {
        if (signal.cancelled) return

        if (readyCheck.state !== 'InProgress' || readyCheck.playerResponse !== 'None') {
          logger.info(
            '[AutoAccept] ReadyCheck 已变化，取消本次自动接受: state=%s, response=%s',
            readyCheck.state,
            readyCheck.playerResponse,
          )
          clearAutoAcceptTimer()
        }
      })
      .catch((err) => {
        if (signal.cancelled) return
        logger.warn('[AutoAccept] ReadyCheck 轮询失败，取消本次自动接受: %o', err)
        clearAutoAcceptTimer()
      })
  }, READY_CHECK_POLL_INTERVAL_MS)
}

function scheduleAcceptMatch() {
  // 清理可能残留的上次调度（防御性）
  clearAutoAcceptTimer()

  const delayMs = computeAcceptDelayMs()

  const doAccept = async (signal: TaskSignal) => {
    try {
      if (signal.cancelled) return

      if (readyCheckPollTimer) {
        clearInterval(readyCheckPollTimer)
        readyCheckPollTimer = null
      }

      if (!await isReadyCheckAcceptable()) {
        logger.info('[AutoAccept] ReadyCheck 不再可接受，跳过本次自动接受')
        return
      }
      if (signal.cancelled) return

      lcu.acceptMatch()
        .then(() => logger.info('Auto accepted match ✓ (delay=%dms)', delayMs))
        .catch((err) => logger.error('Auto accept failed:', err))
    } finally {
      if (activeAutoAcceptSignal === signal) {
        activeAutoAcceptSignal = null
      }
    }
  }

  activeAutoAcceptSignal = autoAcceptTask.schedule(delayMs, doAccept)
  if (delayMs > 0) {
    logger.info('[AutoAccept] 随机延迟 %dms 后接受', delayMs)
    startReadyCheckPolling(activeAutoAcceptSignal)
  }
}

export function updateAutoAccept(enabled: boolean) {
  if (enabled && !autoAcceptUnsub) {
    autoAcceptUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ReadyCheck') {
        scheduleAcceptMatch()
      } else if (activeAutoAcceptSignal || autoAcceptTask.active || readyCheckPollTimer) {
        // ReadyCheck 窗口关闭（玩家手动拒绝 / 自动超时 / 队友拒绝）时清掉定时器，
        // 避免我们稍后的 accept 在"下一次 ReadyCheck 到来前"误触
        clearAutoAcceptTimer()
      }
    })
    logger.info('Auto accept enabled ✓')
  } else if (!enabled && autoAcceptUnsub) {
    autoAcceptUnsub()
    autoAcceptUnsub = null
    clearAutoAcceptTimer()
    logger.info('Auto accept disabled')
  }
}
