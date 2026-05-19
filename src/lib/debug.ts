import { getRecentSonaLogs } from '@/lib/logger'
import { store, type SonaConfig } from '@/lib/store'

type DebugKey = keyof SonaEnhanceDebugApi

type ConfigKey = keyof SonaConfig

const FEATURE_KEYS: ConfigKey[] = [
  'autoAcceptMatch',
  'opggBuildRecommendation',
  'opggAutoApplyRunes',
  'smartBuildRecommendation',
  'champSelectCounterRecommendation',
  'champSelectAssist',
  'analyzeTeamPower',
  'sideIndicator',
  'benchNoCooldown',
  'globalParticle',
  'friendSmartGroup',
  'enhancedFriendGameStatus',
  'lobbyEnhancement',
  'hideTFT',
  'hideRightNavText',
  'autoHonor',
  'autoLockChampion',
  'autoBanChampion',
  'balanceBuffTooltip',
  'champSelectQuitButton',
  'gameAnalysisPopup',
  'autoReturnToLobby',
  'developerMode',
]

const CONFIG_KEYS: ConfigKey[] = [
  ...FEATURE_KEYS,
  'autoAcceptDelayMin',
  'autoAcceptDelayMax',
  'opggBuildRecommendationTier',
  'analyzeTeamPowerMsgType',
  'analyzeTeamPowerFetchCount',
  'champSelectAssistFetchCount',
  'gameAnalysisFetchCount',
  'sideIndicatorMsgType',
  'lobbyEnhancementFetchCount',
  'autoLockInstant',
  'autoReturnMode',
  'language',
  'windowEffect',
  'hotkey',
  'ignoreProfilePrivacy',
  'unlockStatus',
  'unlockAvailability',
  'unlockChromas',
]

function getDebugApi(): SonaEnhanceDebugApi {
  const debug = window.__SONAENHANCE_DEBUG__ ?? {}
  window.__SONAENHANCE_DEBUG__ = debug
  return debug
}

function readConfigKeys(keys: ConfigKey[]) {
  const values: Partial<Record<ConfigKey, SonaConfig[ConfigKey]>> = {}
  keys.forEach((key) => {
    values[key] = store.get(key)
  })
  return values
}

function normalizeLogLimit(limit: unknown): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 50
  return Math.min(200, Math.max(1, Math.floor(limit)))
}

export function registerDebugHandle<K extends DebugKey>(
  key: K,
  handler: NonNullable<SonaEnhanceDebugApi[K]>,
) {
  getDebugApi()[key] = handler
}

export function unregisterDebugHandle(key: DebugKey) {
  if (!window.__SONAENHANCE_DEBUG__) return
  delete window.__SONAENHANCE_DEBUG__[key]
}

export function installCoreDebugHandles() {
  registerDebugHandle('features', () => ({
    updatedAt: Date.now(),
    flags: readConfigKeys(FEATURE_KEYS),
  }))

  registerDebugHandle('config', () => ({
    updatedAt: Date.now(),
    values: readConfigKeys(CONFIG_KEYS),
  }))

  registerDebugHandle('logs', (limit?: number) => ({
    updatedAt: Date.now(),
    entries: getRecentSonaLogs(normalizeLogLimit(limit)),
  }))
}
