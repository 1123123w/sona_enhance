import { logger } from '@/index'
import { registerDebugHandle, unregisterDebugHandle } from '@/lib/debug'
import { lcu, LcuEventUri, type ChampSelectSession, type GameflowPhase, type LCUEventMessage, type ReadyCheck } from '@/lib/lcu'

type Unsubscribe = () => void

export interface RuntimeChampSelectSummary {
  queueId: number
  localPlayerCellId: number
  localChampionId: number
  localChampionPickIntent: number
  myTeam: Array<{
    cellId: number
    championId: number
    championPickIntent: number
    assignedPosition: string
  }>
  theirTeam: Array<{
    cellId: number
    championId: number
    championPickIntent: number
    assignedPosition: string
  }>
}

export interface RuntimeStateSnapshot {
  running: boolean
  lastUpdatedAt: number
  gameflowPhase: GameflowPhase | null
  readyCheck: Pick<ReadyCheck, 'state' | 'playerResponse' | 'timer'> | null
  champSelect: RuntimeChampSelectSummary | null
}

interface RuntimeStateInternal {
  running: boolean
  lastUpdatedAt: number
  gameflowPhase: GameflowPhase | null
  readyCheck: ReadyCheck | null
  champSelectSession: ChampSelectSession | null
}

const state: RuntimeStateInternal = {
  running: false,
  lastUpdatedAt: 0,
  gameflowPhase: null,
  readyCheck: null,
  champSelectSession: null,
}

let unsubs: Unsubscribe[] = []
let refreshToken = 0
let unloadHandler: (() => void) | null = null

function touch() {
  state.lastUpdatedAt = Date.now()
}

function toChampSelectSummary(session: ChampSelectSession | null): RuntimeChampSelectSummary | null {
  if (!session) return null

  const summarizePlayer = (player: ChampSelectSession['myTeam'][number]) => ({
    cellId: player.cellId,
    championId: player.championId,
    championPickIntent: player.championPickIntent,
    assignedPosition: player.assignedPosition || '',
  })
  const localPlayer = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)

  return {
    queueId: session.queueId,
    localPlayerCellId: session.localPlayerCellId,
    localChampionId: localPlayer?.championId ?? 0,
    localChampionPickIntent: localPlayer?.championPickIntent ?? 0,
    myTeam: session.myTeam.map(summarizePlayer),
    theirTeam: session.theirTeam.map(summarizePlayer),
  }
}

function installDebugHandle() {
  registerDebugHandle('runtimeState', getRuntimeStateSnapshot)
}

function clearDebugHandle() {
  unregisterDebugHandle('runtimeState')
}

async function refreshReadyCheck(token: number) {
  try {
    const readyCheck = await lcu.getReadyCheck()
    if (token !== refreshToken) return
    state.readyCheck = readyCheck
    touch()
  } catch (err) {
    if (token !== refreshToken) return
    state.readyCheck = null
    touch()
    logger.debug('[RuntimeState] ReadyCheck refresh skipped: %o', err)
  }
}

async function refreshChampSelect(token: number) {
  try {
    const session = await lcu.getChampSelectSession()
    if (token !== refreshToken) return
    state.champSelectSession = session
    touch()
  } catch (err) {
    if (token !== refreshToken) return
    state.champSelectSession = null
    touch()
    logger.debug('[RuntimeState] ChampSelect refresh skipped: %o', err)
  }
}

async function refreshInitialState(token: number) {
  try {
    const phase = await lcu.getGameflowPhase()
    if (token !== refreshToken) return
    applyPhase(phase, token)
  } catch (err) {
    if (token !== refreshToken) return
    logger.debug('[RuntimeState] Initial phase refresh skipped: %o', err)
  }
}

function applyPhase(phase: GameflowPhase, token: number) {
  state.gameflowPhase = phase
  if (phase !== 'ReadyCheck') {
    state.readyCheck = null
  }
  if (phase !== 'ChampSelect') {
    state.champSelectSession = null
  }
  touch()

  if (phase === 'ReadyCheck') {
    void refreshReadyCheck(token)
  } else if (phase === 'ChampSelect') {
    void refreshChampSelect(token)
  }
}

function handleReadyCheck(event: LCUEventMessage) {
  if (event.eventType === 'Delete') {
    state.readyCheck = null
  } else {
    state.readyCheck = event.data as ReadyCheck
  }
  touch()
}

function handleChampSelect(event: LCUEventMessage) {
  if (event.eventType === 'Delete') {
    state.champSelectSession = null
  } else {
    state.champSelectSession = event.data as ChampSelectSession
  }
  touch()
}

export function getRuntimeStateSnapshot(): RuntimeStateSnapshot {
  return {
    running: state.running,
    lastUpdatedAt: state.lastUpdatedAt,
    gameflowPhase: state.gameflowPhase,
    readyCheck: state.readyCheck
      ? {
          state: state.readyCheck.state,
          playerResponse: state.readyCheck.playerResponse,
          timer: state.readyCheck.timer,
        }
      : null,
    champSelect: toChampSelectSummary(state.champSelectSession),
  }
}

export function getRuntimeGameflowPhase(): GameflowPhase | null {
  return state.gameflowPhase
}

export function getRuntimeChampSelectSession(): ChampSelectSession | null {
  return state.champSelectSession
}

export function initRuntimeState() {
  if (state.running) {
    installDebugHandle()
    return
  }

  state.running = true
  refreshToken++
  const token = refreshToken

  unsubs = [
    lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      applyPhase(event.data as GameflowPhase, token)
    }),
    lcu.observe(LcuEventUri.READY_CHECK, handleReadyCheck),
    lcu.observe(LcuEventUri.CHAMP_SELECT, handleChampSelect),
  ]

  unloadHandler = () => disposeRuntimeState()
  window.addEventListener('beforeunload', unloadHandler, { once: true })

  installDebugHandle()
  void refreshInitialState(token)
  logger.info('[RuntimeState] Runtime state observer initialized')
}

export function disposeRuntimeState() {
  if (!state.running) return

  refreshToken++
  for (const unsub of unsubs) {
    unsub()
  }
  unsubs = []
  if (unloadHandler) {
    window.removeEventListener('beforeunload', unloadHandler)
    unloadHandler = null
  }

  state.running = false
  state.gameflowPhase = null
  state.readyCheck = null
  state.champSelectSession = null
  touch()
  clearDebugHandle()
  logger.info('[RuntimeState] Runtime state observer disposed')
}
