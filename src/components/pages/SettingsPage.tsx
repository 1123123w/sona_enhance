import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { clearOpggCache } from '@/lib/opgg-api'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import { store } from '@/lib/store'
import '@/styles/SettingsPage.css'

const hotkeyOptions = [
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'F5', label: 'F5' },
]

const effectOptions = [
  { value: 'none', label: '无（默认）' },
  { value: 'blurbehind', label: '毛玻璃' },
  { value: 'acrylic', label: '亚克力' },
  { value: 'unified', label: '混合' },
  { value: 'mica', label: '云母 (Win11)' },
  { value: 'transparent', label: '透明' },
]

function BackupManager() {
  const [backupName, setBackupName] = useState('')
  const [backups, setBackups] = useState<{ name: string; timestamp: number }[]>([])
  const [status, setStatus] = useState('')

  const refreshList = async () => {
    const list = await lcu.listBackups()
    setBackups(list)
  }

  useEffect(() => { refreshList() }, [])

  const handleBackup = async () => {
    const name = backupName.trim()
    if (!name) { setStatus('❌ 请输入备份名称'); return }
    setStatus('⏳ 备份中...')
    const ok = await lcu.backupSettings(name)
    setStatus(ok ? '✅ 备份成功' : '❌ 备份失败')
    if (ok) { setBackupName(''); refreshList() }
  }

  const handleRestore = async (name: string) => {
    setStatus(`⏳ 恢复 "${name}" 中...`)
    const ok = await lcu.restoreSettings(name)
    setStatus(ok ? `✅ "${name}" 已恢复` : '❌ 恢复失败')
  }

  const handleDelete = async (name: string) => {
    const ok = await lcu.deleteBackup(name)
    if (ok) {
      setStatus(`已删除 "${name}"`)
      refreshList()
    }
  }

  const formatTime = (ts: number) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <>
      <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SonaInput
            value={backupName}
            onChange={(v) => { setBackupName(v); setStatus('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBackup() }}
            placeholder="输入备份名称 (如: 排位设置)"
          />
        </div>
        <SonaButton variant="primary" onClick={handleBackup}>
          保存备份
        </SonaButton>
      </div>
      {status && <p className="sona-subtitle" style={{ marginTop: 6 }}>{status}</p>}
      {backups.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {backups.map((b) => (
            <div key={b.name} className="sona-backup-item">
              <div className="sona-backup-info">
                <span className="sona-backup-name">{b.name}</span>
                <span className="sona-backup-time">{formatTime(b.timestamp)}</span>
              </div>
              <div className="sona-backup-actions">
                <SonaButton onClick={() => handleRestore(b.name)}>恢复</SonaButton>
                <SonaButton onClick={() => handleDelete(b.name)}>删除</SonaButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function SettingsPage() {
  const [hotkey, setHotkey] = useState(store.get('hotkey'))
  const [globalParticle, setGlobalParticle] = useState(store.get('globalParticle'))
  const [hideTFT, setHideTFT] = useState(store.get('hideTFT'))
  const [hideRightNavText, setHideRightNavText] = useState(store.get('hideRightNavText'))
  const [windowEffect, setWindowEffect] = useState(store.get('windowEffect'))
  const [opggCacheStatus, setOpggCacheStatus] = useState('')

  useEffect(() => {
    const unsubs = [
      store.onChange('hotkey', setHotkey),
      store.onChange('globalParticle', setGlobalParticle),
      store.onChange('hideTFT', setHideTFT),
      store.onChange('hideRightNavText', setHideRightNavText),
      store.onChange('windowEffect', setWindowEffect),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  const handleEffectChange = (value: string) => {
    setWindowEffect(value)
    store.set('windowEffect', value)
    if (value === 'none') {
      Effect.clear()
      logger.info('Window effect cleared')
    } else {
      Effect.apply(value as 'acrylic', { color: '#0006' })
      logger.info('Window effect applied: %s', value)
    }
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">设置</h2>

      <SettingGroup title="通用">
        <SettingCard
          title="面板快捷键"
          description="随时按下快捷键打开/关闭 Sona 面板。"
        >
          <SonaSelect
            options={hotkeyOptions}
            value={hotkey}
            onChange={(v) => { setHotkey(v); store.set('hotkey', v) }}
          />
        </SettingCard>
        <SettingCard
          title="全局粒子美化"
          description="为客户端添加星光粒子背景效果 ✨"
        >
          <SonaSwitch
            checked={globalParticle}
            onChange={(v) => { setGlobalParticle(v); store.set('globalParticle', v) }}
          />
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="客户端界面">
        <SettingCard
          title="隐藏首页云顶之弈"
          description="隐藏顶部导航栏的云顶之弈入口；不会改变客户端当前记住的 Play 页分类。"
        >
          <SonaSwitch
            checked={hideTFT}
            onChange={(v) => { setHideTFT(v); store.set('hideTFT', v) }}
          />
        </SettingCard>
        <SettingCard
          title="隐藏右侧导航文字"
          description="隐藏主页顶部右侧导航栏文字，仅保留图标。"
        >
          <SonaSwitch
            checked={hideRightNavText}
            onChange={(v) => { setHideRightNavText(v); store.set('hideRightNavText', v) }}
          />
        </SettingCard>
        <SettingCard
          title="窗口特效"
          description="为客户端窗口添加毛玻璃、亚克力等视觉效果。"
        >
          <div style={{ minWidth: 130 }}>
            <SonaSelect
              options={effectOptions}
              value={windowEffect}
              onChange={handleEffectChange}
            />
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="设置备份">
        <p className="sona-subtitle" style={{ marginBottom: 10 }}>备份当前客户端设置（快捷键、界面布局等），支持多个命名存档。</p>
        <BackupManager />
      </SettingGroup>

      <SettingGroup title="高级选项">
        <SettingCard
          title="清空 OP.GG 缓存"
          description="清除本地保存的 OP.GG 推荐出装、英雄 T 级和 Counter 数据；下次使用时会重新请求。"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SonaButton onClick={() => {
              const count = clearOpggCache()
              setOpggCacheStatus(count >= 0 ? `已清空 ${count} 条缓存` : '清空失败')
            }}>
              清空
            </SonaButton>
            {opggCacheStatus && <span className="sona-subtitle">{opggCacheStatus}</span>}
          </div>
        </SettingCard>
      </SettingGroup>
    </div>
  )
}
