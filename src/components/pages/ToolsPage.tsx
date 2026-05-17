import { useState, useEffect, useRef } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { searchChampions, getChampionById, type ChampionInfo } from '@/lib/assets'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

const toolSections = [
  { id: 'champ-select', label: '选人增强' },
  { id: 'opgg', label: 'OP.GG 推荐' },
  { id: 'automation', label: '对局自动化' },
  { id: 'social', label: '组队/好友' },
  { id: 'rank', label: '段位伪装' },
]

function scrollToToolSection(id: string) {
  document.getElementById(`tool-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function ChampionPriorityCards({
  championIds,
  emptyText,
  onRemove,
}: {
  championIds: number[]
  emptyText: string
  onRemove: (championId: number) => void
}) {
  if (championIds.length === 0) {
    return <p className="sona-subtitle" style={{ margin: 0 }}>{emptyText}</p>
  }

  return (
    <div className="sona-champ-priority-list">
      {championIds.map((championId, index) => {
        const champion = getChampionById(championId)
        return (
          <div className="sona-champ-priority-card" key={championId}>
            <span className="sona-champ-priority-index">{index + 1}</span>
            <img
              className="sona-champ-priority-icon"
              src={`/lol-game-data/assets/v1/champion-icons/${championId}.png`}
              alt=""
            />
            <span className="sona-champ-priority-name">
              {champion ? `${champion.title} ${champion.name}` : `英雄#${championId}`}
            </span>
            <button
              className="sona-champ-priority-remove"
              type="button"
              onClick={() => onRemove(championId)}
              aria-label="移除"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function ToolsPage() {
  const [autoAccept, setAutoAccept] = useState(store.get('autoAcceptMatch'))
  // 延迟值在 UI 里用字符串存，避免"删到空 → 变 NaN"、"输到一半"等中间态被推回 store
  const [autoAcceptDelayMin, setAutoAcceptDelayMin] = useState(String(store.get('autoAcceptDelayMin')))
  const [autoAcceptDelayMax, setAutoAcceptDelayMax] = useState(String(store.get('autoAcceptDelayMax')))
  const [unlockStatus, setUnlockStatus] = useState(store.get('unlockStatus'))
  const [unlockAvailability, setUnlockAvailability] = useState(store.get('unlockAvailability'))
  const [unlockChromas, setUnlockChromas] = useState(store.get('unlockChromas'))
  const [benchNoCooldown, setBenchNoCooldown] = useState(store.get('benchNoCooldown'))
  const [champSelectAssist, setChampSelectAssist] = useState(store.get('champSelectAssist'))
  const [opggBuildRecommendation, setOpggBuildRecommendation] = useState(store.get('opggBuildRecommendation'))
  const [opggAutoApplyRunes, setOpggAutoApplyRunes] = useState(store.get('opggAutoApplyRunes'))
  const [champSelectCounterRecommendation, setChampSelectCounterRecommendation] = useState(store.get('champSelectCounterRecommendation'))
  const [smartBuildRecommendation, setSmartBuildRecommendation] = useState(store.get('smartBuildRecommendation'))
  const [balanceBuffTooltip, setBalanceBuffTooltip] = useState(store.get('balanceBuffTooltip'))
  const [champSelectQuitButton, setChampSelectQuitButton] = useState(store.get('champSelectQuitButton'))
  const [gameAnalysisPopup, setGameAnalysisPopup] = useState(store.get('gameAnalysisPopup'))
  const [autoReturnToLobby, setAutoReturnToLobby] = useState(store.get('autoReturnToLobby'))
  const [autoReturnMode, setAutoReturnMode] = useState(store.get('autoReturnMode'))
  const [analyzeTeamPower, setAnalyzeTeamPower] = useState(store.get('analyzeTeamPower'))
  const [analyzeTeamPowerMsgType, setAnalyzeTeamPowerMsgType] = useState(store.get('analyzeTeamPowerMsgType'))
  const [analyzeTeamPowerFetchCount, setAnalyzeTeamPowerFetchCount] = useState(store.get('analyzeTeamPowerFetchCount'))
  const [champSelectAssistFetchCount, setChampSelectAssistFetchCount] = useState(store.get('champSelectAssistFetchCount'))
  const [gameAnalysisFetchCount, setGameAnalysisFetchCount] = useState(store.get('gameAnalysisFetchCount'))
  const [sideIndicator, setSideIndicator] = useState(store.get('sideIndicator'))
  const [sideIndicatorMsgType, setSideIndicatorMsgType] = useState(store.get('sideIndicatorMsgType'))
  const [friendSmartGroup, setFriendSmartGroup] = useState(store.get('friendSmartGroup'))
  const [enhancedFriendGameStatus, setEnhancedFriendGameStatus] = useState(store.get('enhancedFriendGameStatus'))
  const [lobbyEnhancement, setLobbyEnhancement] = useState(store.get('lobbyEnhancement'))
  const [lobbyEnhancementFetchCount, setLobbyEnhancementFetchCount] = useState(store.get('lobbyEnhancementFetchCount'))
  const [customProfileBg, setCustomProfileBg] = useState(store.get('customProfileBg'))
  const [customBanner, setCustomBanner] = useState(store.get('customBanner'))
  const [rankQueue, setRankQueue] = useState(store.get('rankQueue'))
  const [rankTier, setRankTier] = useState(store.get('rankTier'))
  const [rankDivision, setRankDivision] = useState(store.get('rankDivision'))
  const [autoHonor, setAutoHonor] = useState(store.get('autoHonor'))
  const [autoLockChampion, setAutoLockChampion] = useState(store.get('autoLockChampion'))
  const [autoLockChampionIds, setAutoLockChampionIds] = useState(store.get('autoLockChampionIds'))
  const [champSearchText, setChampSearchText] = useState('')
  const [champSuggestions, setChampSuggestions] = useState<ChampionInfo[]>([])
  const [showChampSuggestions, setShowChampSuggestions] = useState(false)
  const [autoLockInstant, setAutoLockInstant] = useState(store.get('autoLockInstant'))
  const champSuggestRef = useRef<HTMLDivElement>(null)
  const [autoBanChampion, setAutoBanChampion] = useState(store.get('autoBanChampion'))
  const [autoBanChampionIds, setAutoBanChampionIds] = useState(store.get('autoBanChampionIds'))
  const [banChampSearchText, setBanChampSearchText] = useState('')
  const [banChampSuggestions, setBanChampSuggestions] = useState<ChampionInfo[]>([])
  const [showBanChampSuggestions, setShowBanChampSuggestions] = useState(false)
  const banChampSuggestRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const unsubs = [
      store.onChange('autoAcceptMatch', setAutoAccept),
      store.onChange('autoAcceptDelayMin', (v) => setAutoAcceptDelayMin(String(v))),
      store.onChange('autoAcceptDelayMax', (v) => setAutoAcceptDelayMax(String(v))),
      store.onChange('unlockStatus', setUnlockStatus),
      store.onChange('unlockAvailability', setUnlockAvailability),
      store.onChange('unlockChromas', setUnlockChromas),
      store.onChange('benchNoCooldown', setBenchNoCooldown),
      store.onChange('champSelectAssist', setChampSelectAssist),
      store.onChange('opggBuildRecommendation', setOpggBuildRecommendation),
      store.onChange('opggAutoApplyRunes', setOpggAutoApplyRunes),
      store.onChange('champSelectCounterRecommendation', setChampSelectCounterRecommendation),
      store.onChange('smartBuildRecommendation', setSmartBuildRecommendation),
      store.onChange('balanceBuffTooltip', setBalanceBuffTooltip),
      store.onChange('champSelectQuitButton', setChampSelectQuitButton),
      store.onChange('gameAnalysisPopup', setGameAnalysisPopup),
      store.onChange('autoReturnToLobby', setAutoReturnToLobby),
      store.onChange('autoReturnMode', setAutoReturnMode),
      store.onChange('analyzeTeamPower', setAnalyzeTeamPower),
      store.onChange('analyzeTeamPowerFetchCount', setAnalyzeTeamPowerFetchCount),
      store.onChange('champSelectAssistFetchCount', setChampSelectAssistFetchCount),
      store.onChange('gameAnalysisFetchCount', setGameAnalysisFetchCount),
      store.onChange('sideIndicator', setSideIndicator),
      store.onChange('friendSmartGroup', setFriendSmartGroup),
      store.onChange('enhancedFriendGameStatus', setEnhancedFriendGameStatus),
      store.onChange('lobbyEnhancement', setLobbyEnhancement),
      store.onChange('lobbyEnhancementFetchCount', setLobbyEnhancementFetchCount),
      store.onChange('customProfileBg', setCustomProfileBg),
      store.onChange('customBanner', setCustomBanner),
      store.onChange('autoHonor', setAutoHonor),
      store.onChange('autoLockChampion', setAutoLockChampion),
      store.onChange('autoLockChampionIds', setAutoLockChampionIds),
      store.onChange('autoBanChampion', setAutoBanChampion),
      store.onChange('autoBanChampionIds', setAutoBanChampionIds),
      store.onChange('rankQueue', setRankQueue),
      store.onChange('rankTier', setRankTier),
      store.onChange('rankDivision', setRankDivision),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  // 点击外部关闭英雄联想下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (champSuggestRef.current && !champSuggestRef.current.contains(e.target as Node)) {
        setShowChampSuggestions(false)
      }
      if (banChampSuggestRef.current && !banChampSuggestRef.current.contains(e.target as Node)) {
        setShowBanChampSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])


  const addAutoLockChampion = (champion: ChampionInfo) => {
    if (autoLockChampionIds.includes(champion.id)) {
      setChampSearchText('')
      setShowChampSuggestions(false)
      return
    }

    const next = [...autoLockChampionIds, champion.id]
    setAutoLockChampionIds(next)
    store.set('autoLockChampionIds', next)
    setChampSearchText('')
    setShowChampSuggestions(false)
    logger.info('[AutoLock] 已加入目标英雄队列: %s %s (ID: %d)', champion.title, champion.name, champion.id)
  }

  const removeAutoLockChampion = (championId: number) => {
    const next = autoLockChampionIds.filter((id) => id !== championId)
    setAutoLockChampionIds(next)
    store.set('autoLockChampionIds', next)
  }

  const addAutoBanChampion = (champion: ChampionInfo) => {
    if (autoBanChampionIds.includes(champion.id)) {
      setBanChampSearchText('')
      setShowBanChampSuggestions(false)
      return
    }

    const next = [...autoBanChampionIds, champion.id]
    setAutoBanChampionIds(next)
    store.set('autoBanChampionIds', next)
    setBanChampSearchText('')
    setShowBanChampSuggestions(false)
    logger.info('[AutoBan] 已加入目标英雄队列: %s %s (ID: %d)', champion.title, champion.name, champion.id)
  }

  const removeAutoBanChampion = (championId: number) => {
    const next = autoBanChampionIds.filter((id) => id !== championId)
    setAutoBanChampionIds(next)
    store.set('autoBanChampionIds', next)
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">工具</h2>

      <div className="sona-tool-nav">
        {toolSections.map((section) => (
          <button key={section.id} type="button" onClick={() => scrollToToolSection(section.id)}>
            {section.label}
          </button>
        ))}
      </div>

      <section id="tool-section-champ-select" className="sona-tool-section">
      <SettingGroup title="选人增强">
        <SettingCard
          title="自动接受对局"
          description="匹配到对局时自动点击接受，再也不会错过。"
        >
          <SonaSwitch
            checked={autoAccept}
            onChange={(v) => { setAutoAccept(v); store.set('autoAcceptMatch', v) }}
          />
        </SettingCard>
        {autoAccept && (
          <SettingCard
            title="自动接受的随机延迟"
            description="在区间内随机延迟后再接受（上限 15000ms）。"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80 }}>
                <SonaInput
                  value={autoAcceptDelayMin}
                  onChange={(v) => {
                    // 毫秒只收整数
                    const cleaned = v.replace(/[^\d]/g, '')
                    setAutoAcceptDelayMin(cleaned)
                    const n = parseInt(cleaned, 10)
                    store.set('autoAcceptDelayMin', Number.isFinite(n) ? n : 0)
                  }}
                  placeholder="最小"
                />
              </div>
              <span style={{ color: '#a09b8c', fontSize: 13 }}>—</span>
              <div style={{ width: 80 }}>
                <SonaInput
                  value={autoAcceptDelayMax}
                  onChange={(v) => {
                    const cleaned = v.replace(/[^\d]/g, '')
                    setAutoAcceptDelayMax(cleaned)
                    const n = parseInt(cleaned, 10)
                    store.set('autoAcceptDelayMax', Number.isFinite(n) ? n : 0)
                  }}
                  placeholder="最大"
                />
              </div>
              <span style={{ color: '#a09b8c', fontSize: 13 }}>毫秒</span>
            </div>
          </SettingCard>
        )}
        <SettingCard
          title="大乱斗无CD换英雄"
          description="移除共享池英雄的切换冷却限制，随时换取心仪英雄。"
        >
          <SonaSwitch
            checked={benchNoCooldown}
            onChange={(v) => { setBenchNoCooldown(v); store.set('benchNoCooldown', v) }}
          />
        </SettingCard>
        <SettingCard
          title="分析友方战力"
          description="进入英雄选择时，自动分析队友近期战绩并发送到队伍聊天框。"
        >
          <SonaSelect
            value={String(analyzeTeamPowerFetchCount)}
            onChange={(v) => { setAnalyzeTeamPowerFetchCount(Number(v)); store.set('analyzeTeamPowerFetchCount', Number(v)) }}
            options={[
              { value: '20', label: '近20局' },
              { value: '50', label: '近50局' },
              { value: '100', label: '近100局' },
            ]}
          />
          <SonaSelect
            value={analyzeTeamPowerMsgType}
            onChange={(v) => { setAnalyzeTeamPowerMsgType(v); store.set('analyzeTeamPowerMsgType', v) }}
            options={[
              { value: 'celebration', label: '自己可见' },
              { value: 'chat', label: '全队可见' },
            ]}
          />
          <SonaSwitch
            checked={analyzeTeamPower}
            onChange={(v) => { setAnalyzeTeamPower(v); store.set('analyzeTeamPower', v) }}
          />
        </SettingCard>
        <SettingCard
          title="红蓝方提示"
          description="进入英雄选择时，在聊天框提示本局是蓝方还是红方。"
        >
          <SonaSelect
            value={sideIndicatorMsgType}
            onChange={(v) => { setSideIndicatorMsgType(v); store.set('sideIndicatorMsgType', v) }}
            options={[
              { value: 'celebration', label: '自己可见' },
              { value: 'chat', label: '全队可见' },
            ]}
          />
          <SonaSwitch
            checked={sideIndicator}
            onChange={(v) => { setSideIndicator(v); store.set('sideIndicator', v) }}
          />
        </SettingCard>
        <SettingCard
          title="英雄选择阶段增强"
          description="选人阶段显示队友近期表现、英雄 T 级角标，并支持点击队友头像查看战绩。"
        >
          <SonaSelect
            value={String(champSelectAssistFetchCount)}
            onChange={(v) => { setChampSelectAssistFetchCount(Number(v)); store.set('champSelectAssistFetchCount', Number(v)) }}
            options={[
              { value: '20', label: '近20局' },
              { value: '50', label: '近50局' },
              { value: '100', label: '近100局' },
            ]}
          />
          <SonaSwitch
            checked={champSelectAssist}
            onChange={(v) => { setChampSelectAssist(v); store.set('champSelectAssist', v) }}
          />
        </SettingCard>
      </SettingGroup>
      </section>

      <section id="tool-section-opgg" className="sona-tool-section">
      <SettingGroup title="OP.GG 推荐">
        <SettingCard
          title="配装推荐面板"
          description="选人阶段打开当前英雄的 OP.GG KR 出装、符文、召唤师技能和 matchup 推荐。Ban 推荐入口也依赖此功能。"
        >
          <SonaSwitch
            checked={opggBuildRecommendation}
            onChange={(v) => { setOpggBuildRecommendation(v); store.set('opggBuildRecommendation', v) }}
          />
        </SettingCard>
        <SettingCard
          title="锁定后自动应用符文"
          description="锁定英雄后自动应用 OP.GG KR 第一套符文；如果已有智能保存符文，会优先保留个人配置。"
        >
          <SonaSwitch
            checked={opggAutoApplyRunes}
            onChange={(v) => { setOpggAutoApplyRunes(v); store.set('opggAutoApplyRunes', v) }}
          />
        </SettingCard>
        <SettingCard
          title="Counter 英雄推荐"
          description="排位选人时点击敌方头像，基于 OP.GG KR ranked 数据查看 counter 英雄列表。"
        >
          <SonaSwitch
            checked={champSelectCounterRecommendation}
            onChange={(v) => { setChampSelectCounterRecommendation(v); store.set('champSelectCounterRecommendation', v) }}
          />
        </SettingCard>
        <SettingCard
          title="智能配装 & 符文 & 召唤师技能"
          description="按英雄和模式同步装备集，并记忆、恢复你手动保存过的符文和召唤师技能。"
        >
          <SonaSwitch
            checked={smartBuildRecommendation}
            onChange={(v) => { setSmartBuildRecommendation(v); store.set('smartBuildRecommendation', v) }}
          />
        </SettingCard>
      </SettingGroup>
      </section>

      <section id="tool-section-automation" className="sona-tool-section">
      <SettingGroup title="对局自动化">
        <SettingCard
          title="平衡性调整buff提示"
          description="游玩特定模式（大乱斗、无限火力）时，鼠标悬停在英雄头像上，显示对应的平衡性数值调整。"
        >
          <SonaSwitch
            checked={balanceBuffTooltip}
            onChange={(v) => { setBalanceBuffTooltip(v); store.set('balanceBuffTooltip', v) }}
          />
        </SettingCard>
        {/* 这个选人阶段退出，没找到合适的LCU接口，暂时加不了 */}
        {/* <SettingCard
          title="选人阶段退出按钮"
          description="非自定义对局的英雄选择里客户端不会显示退出按钮，Sona 帮你补一个。点击后会弹确认窗，秒退会扣逃跑分。"
        >
          <SonaSwitch
            checked={champSelectQuitButton}
            onChange={(v) => { setChampSelectQuitButton(v); store.set('champSelectQuitButton', v) }}
          />
        </SettingCard> */}
        <SettingCard
          title="全局战力分析弹窗"
          description="进入游戏后，自动弹窗展示双方队伍战力分析，包括胜率、KDA、段位、开黑分组。(注，不是直接在游戏内展示，需要切回客户端查看)"
        >
          <SonaSelect
            value={String(gameAnalysisFetchCount)}
            onChange={(v) => { setGameAnalysisFetchCount(Number(v)); store.set('gameAnalysisFetchCount', Number(v)) }}
            options={[
              { value: '20', label: '近20局' },
              { value: '50', label: '近50局' },
              { value: '100', label: '近100局' },
            ]}
          />
          <SonaSwitch
            checked={gameAnalysisPopup}
            onChange={(v) => { setGameAnalysisPopup(v); store.set('gameAnalysisPopup', v) }}
          />
        </SettingCard>
        <SettingCard
          title="对局结束自动返回房间"
          description="对局结束后自动返回房间，省去手动操作。可选择自动排队或仅返回房间。"
        >
          <SonaSelect
            value={autoReturnMode}
            onChange={(v) => { setAutoReturnMode(v); store.set('autoReturnMode', v) }}
            options={[
              { value: 'queue', label: '自动排队' },
              { value: 'lobby', label: '仅返回房间' },
            ]}
          />
          <SonaSwitch
            checked={autoReturnToLobby}
            onChange={(v) => { setAutoReturnToLobby(v); store.set('autoReturnToLobby', v) }}
          />
        </SettingCard>
        <SettingCard
          title="对局结束自动点赞"
          description="对局结束后，随机给队友点赞，再也不用手点啦。"
        >
          <SonaSwitch
            checked={autoHonor}
            onChange={(v) => { setAutoHonor(v); store.set('autoHonor', v) }}
          />
        </SettingCard>
        <SettingCard
          title="秒抢英雄"
          description="进入可选英雄的模式时，轮到自己自动秒锁指定英雄。大乱斗等无需选人的模式不受影响。"
        >
          <SonaSwitch
            checked={autoLockChampion}
            onChange={(v) => { setAutoLockChampion(v); store.set('autoLockChampion', v) }}
          />
        </SettingCard>
        {autoLockChampion && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sona-debug-actions" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }} ref={champSuggestRef}>
                <SonaInput
                  value={champSearchText}
                  onChange={(v) => {
                    setChampSearchText(v)
                    const results = searchChampions(v)
                    setChampSuggestions(results)
                    setShowChampSuggestions(results.length > 0)
                  }}
                  placeholder="输入英雄名/称号搜索 (如: 亚索)"
                />
                {showChampSuggestions && champSuggestions.length > 0 && (
                  <div className="sona-champ-suggest">
                    {champSuggestions.map((c) => (
                      <button
                        key={c.id}
                        className="sona-champ-suggest-item"
                        type="button"
                        onClick={() => addAutoLockChampion(c)}
                      >
                        <img className="sona-champ-suggest-icon" src={`/lol-game-data/assets/v1/champion-icons/${c.id}.png`} alt="" />
                        <span className="sona-champ-suggest-title">{c.title}</span>
                        <span className="sona-champ-suggest-name">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <SonaButton
                variant={autoLockInstant ? 'primary' : undefined}
                onClick={() => { setAutoLockInstant(true); store.set('autoLockInstant', true) }}
              >
                秒选并锁定{autoLockInstant ? ' ✓' : ''}
              </SonaButton>
              <SonaButton
                variant={!autoLockInstant ? 'primary' : undefined}
                onClick={() => { setAutoLockInstant(false); store.set('autoLockInstant', false) }}
              >
                仅预选{!autoLockInstant ? ' ✓' : ''}
              </SonaButton>
            </div>
            <ChampionPriorityCards
              championIds={autoLockChampionIds}
              emptyText="还没有添加秒抢英雄，按优先级从左到右尝试。"
              onRemove={removeAutoLockChampion}
            />
          </div>
        )}
        <SettingCard
          title="自动 Ban 英雄"
          description="进入有禁用阶段的模式时，轮到自己自动禁用指定英雄。匹配、大乱斗等无ban的不受影响。"
        >
          <SonaSwitch
            checked={autoBanChampion}
            onChange={(v) => { setAutoBanChampion(v); store.set('autoBanChampion', v) }}
          />
        </SettingCard>
        {autoBanChampion && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sona-debug-actions" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }} ref={banChampSuggestRef}>
                <SonaInput
                  value={banChampSearchText}
                  onChange={(v) => {
                    setBanChampSearchText(v)
                    const results = searchChampions(v)
                    setBanChampSuggestions(results)
                    setShowBanChampSuggestions(results.length > 0)
                  }}
                  placeholder="搜索要 Ban 的英雄 (如: 亚索 / Yasuo)"
                />
                {showBanChampSuggestions && (
                  <div className="sona-champ-suggest">
                    {banChampSuggestions.map((c) => (
                      <button
                        key={c.id}
                        className="sona-champ-suggest-item"
                        type="button"
                        onClick={() => addAutoBanChampion(c)}
                      >
                        <img className="sona-champ-suggest-icon" src={`/lol-game-data/assets/v1/champion-icons/${c.id}.png`} alt="" />
                        <span className="sona-champ-suggest-title">{c.title}</span>
                        <span className="sona-champ-suggest-name">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ChampionPriorityCards
              championIds={autoBanChampionIds}
              emptyText="还没有添加自动 Ban 英雄，按优先级从左到右尝试。"
              onRemove={removeAutoBanChampion}
            />
          </div>
        )}
      </SettingGroup>
      </section>

      <section id="tool-section-social" className="sona-tool-section">
      <SettingGroup title="组队/好友">
        <SettingCard
          title="解锁自定义签名"
          description="移除客户端对签名编辑的禁用限制，可自由修改个人签名。"
        >
          <SonaSwitch
            checked={unlockStatus}
            onChange={(v) => { setUnlockStatus(v); store.set('unlockStatus', v) }}
          />
        </SettingCard>
        <SettingCard
          title="解锁在线状态切换"
          description="接管客户端的状态按钮，支持切换至隐身、手机在线等客户端默认不提供的状态。"
        >
          <SonaSwitch
            checked={unlockAvailability}
            onChange={(v) => { setUnlockAvailability(v); store.set('unlockAvailability', v) }}
          />
        </SettingCard>
        <SettingCard
          title="解锁炫彩分页（国服）"
          description="在生涯藏品页恢复被隐藏的「炫彩」子分页。修改开关后需要重启客户端才能生效。"
        >
          <SonaSwitch
            checked={unlockChromas}
            onChange={(v) => { setUnlockChromas(v); store.set('unlockChromas', v) }}
          />
        </SettingCard>
        <SettingCard
          title="卸下头像边框"
          description="移除头像框装饰，恢复干净的头像展示。(需召唤师等级>=525)"
        >
          <SonaButton onClick={async () => {
            try {
              await fetch('/lol-regalia/v2/current-summoner/regalia', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferredCrestType: 'prestige', preferredBannerType: 'blank', selectedPrestigeCrest: 0 }),
              })
              logger.info('头像边框已卸下 ✓')
            } catch (err) {
              logger.error('卸下头像边框失败:', err)
            }
          }}>
            卸下
          </SonaButton>
        </SettingCard>
        <SettingCard
          title="卸下头像"
          description="将召唤师头像恢复为客户端默认头像。"
        >
          <SonaButton onClick={async () => {
            try {
              await lcu.setProfileIcon(29)
              logger.info('头像已恢复为默认头像 ✓')
            } catch (err) {
              logger.error('恢复默认头像失败:', err)
            }
          }}>
            卸下
          </SonaButton>
        </SettingCard>
        <SettingCard
          title="自定义生涯背景"
          description="增强修改生涯背景弹窗，可以选择任意皮肤作为生涯背景。(好友可见)"
        >
          <SonaSwitch
            checked={customProfileBg}
            onChange={(v) => { setCustomProfileBg(v); store.set('customProfileBg', v) }}
          />
        </SettingCard>
        <SettingCard
          title="自定义旗帜"
          description="在原有设置旗帜处新增自定义旗帜按钮，更换的旗帜仅自己可见。"
        >
          <SonaSwitch
            checked={customBanner}
            onChange={(v) => { setCustomBanner(v); store.set('customBanner', v) }}
          />
        </SettingCard>
        <SettingCard
          title="开黑好友标记"
          description="好友列表中，同局开黑的好友使用同色标记。"
        >
          <SonaSwitch
            checked={friendSmartGroup}
            onChange={(v) => { setFriendSmartGroup(v); store.set('friendSmartGroup', v) }}
          />
        </SettingCard>
        <SettingCard
          title="增强游戏中好友状态"
          description="好友游戏中时，在右侧好友列表显示游戏模式和对局时长。"
        >
          <SonaSwitch
            checked={enhancedFriendGameStatus}
            onChange={(v) => { setEnhancedFriendGameStatus(v); store.set('enhancedFriendGameStatus', v) }}
          />
        </SettingCard>
        <SettingCard
          title="组队界面增强"
          description="组队界面点击成员头像区域查看战绩，并显示该模式近期胜率、KDA 和评分。"
        >
          <SonaSelect
            value={String(lobbyEnhancementFetchCount)}
            onChange={(v) => { setLobbyEnhancementFetchCount(Number(v)); store.set('lobbyEnhancementFetchCount', Number(v)) }}
            options={[
              { value: '20', label: '近20局' },
              { value: '50', label: '近50局' },
              { value: '100', label: '近100局' },
            ]}
          />
          <SonaSwitch
            checked={lobbyEnhancement}
            onChange={(v) => { setLobbyEnhancement(v); store.set('lobbyEnhancement', v) }}
          />
        </SettingCard>
      </SettingGroup>
      </section>

      <section id="tool-section-rank" className="sona-tool-section">
      <SettingGroup title="段位伪装">
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>伪装好友列表中显示的段位信息，仅影响聊天名片展示，不影响生涯页面。(好友可见)</p>
        <div className="sona-debug-actions" style={{ alignItems: 'center' }}>
          <div style={{ minWidth: 140 }}>
            <SonaSelect
              options={[
                { value: 'RANKED_SOLO_5x5', label: '单排/双排' },
                { value: 'RANKED_FLEX_SR', label: '灵活组排' },
                { value: 'RANKED_FLEX_TT', label: '灵活 3v3' },
                { value: 'RANKED_TFT', label: '云顶之弈' },
                { value: 'RANKED_TFT_DOUBLE_UP', label: '云顶双人' },
                { value: 'RANKED_TFT_TURBO', label: '云顶激斗' },
              ]}
              value={rankQueue}
              onChange={setRankQueue}
            />
          </div>
          <div style={{ minWidth: 130 }}>
            <SonaSelect
              options={[
                { value: 'CHALLENGER', label: '最强王者' },
                { value: 'GRANDMASTER', label: '傲世宗师' },
                { value: 'MASTER', label: '超凡大师' },
                { value: 'DIAMOND', label: '璀璨钻石' },
                { value: 'EMERALD', label: '流光翡翠' },
                { value: 'PLATINUM', label: '华贵铂金' },
                { value: 'GOLD', label: '荣耀黄金' },
                { value: 'SILVER', label: '不屈白银' },
                { value: 'BRONZE', label: '英勇青铜' },
                { value: 'IRON', label: '坚韧黑铁' },
              ]}
              value={rankTier}
              onChange={setRankTier}
            />
          </div>
          <div style={{ minWidth: 80 }}>
            <SonaSelect
              options={[
                { value: 'I', label: 'I' },
                { value: 'II', label: 'II' },
                { value: 'III', label: 'III' },
                { value: 'IV', label: 'IV' },
              ]}
              value={rankDivision}
              onChange={setRankDivision}
            />
          </div>
          <SonaButton onClick={() => {
            store.set('rankQueue', rankQueue)
            store.set('rankTier', rankTier)
            store.set('rankDivision', rankDivision)
            store.set('rankDisguise', true)
          }}>
            应用
          </SonaButton>
          <SonaButton onClick={() => {
            store.set('rankDisguise', false)
          }}>
            恢复
          </SonaButton>
        </div>
      </SettingGroup>
      </section>
    </div>
  )
}
