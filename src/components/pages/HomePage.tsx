import { useEffect, useRef, useState } from 'react'
import '@/styles/HomePage.css'
import '@/styles/SettingsPage.css'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { MatchHistoryModal } from '@/components/ui/MatchHistoryModal'
import { lcu } from '@/lib/lcu'
import { logger } from '@/index'
import { useI18n } from '@/lib/i18n'
import sonaIcon from '@/../assets/Champie_Sona_profileicon.png'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    const particles: Array<{
      x: number; y: number
      vx: number; vy: number
      size: number; opacity: number
      life: number; maxLife: number
      isGold: boolean
    }> = []

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }

    const spawn = () => {
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const isGold = Math.random() > 0.35
      // 在头像圆形边缘附近生成
      const angle = Math.random() * Math.PI * 2
      const radius = 30 + Math.random() * 20
      particles.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.12 + 0.05),
        size: Math.random() * 1.8 + 0.5,
        opacity: 0,
        life: 0,
        maxLife: 50 + Math.random() * 50,
        isGold,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 每帧生成 1 个粒子
      if (particles.length < 80) {
        spawn()
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        // 水平微微飘动
        p.vx += (Math.random() - 0.5) * 0.01
        // 向上的轻微加速（负重力，越飘越轻）
        p.vy -= 0.001

        // 前 20% 淡入，后 30% 淡出
        const progress = p.life / p.maxLife
        if (progress < 0.2) {
          p.opacity = (progress / 0.2) * 0.8
        } else if (progress > 0.7) {
          p.opacity = ((1 - progress) / 0.3) * 0.8
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        if (p.isGold) {
          ctx.shadowBlur = 6
          ctx.shadowColor = `rgba(200, 170, 110, ${p.opacity})`
          ctx.fillStyle = `rgba(220, 190, 130, ${p.opacity})`
        } else {
          ctx.shadowBlur = 5
          ctx.shadowColor = `rgba(0, 180, 255, ${p.opacity * 0.8})`
          ctx.fillStyle = `rgba(100, 200, 255, ${p.opacity * 0.85})`
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      animId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="sona-home-particle-canvas" />
}

export function HomePage() {
  const { t } = useI18n()
  const [searchRiotId, setSearchRiotId] = useState('')
  const [searchError, setSearchError] = useState('')
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchModalPuuid, setMatchModalPuuid] = useState('')
  const [matchModalName, setMatchModalName] = useState('')
  const [replayGameId, setReplayGameId] = useState('')
  const [replayState, setReplayState] = useState<'idle' | 'downloading' | 'ready' | 'launching' | 'error'>('idle')

  const handleSearchMatch = async () => {
    const parts = searchRiotId.trim().split('#')
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setSearchError(t('home.matchFormatError'))
      return
    }

    setSearchError('')
    try {
      const summoner = await lcu.getSummonerByRiotId(parts[0], parts[1])
      if (!summoner?.puuid) {
        setSearchError(t('home.matchNotFound'))
        return
      }
      setMatchModalPuuid(summoner.puuid)
      setMatchModalName(`${parts[0]}#${parts[1]}`)
      setMatchModalOpen(true)
    } catch {
      setSearchError(t('home.matchFailed'))
    }
  }

  const handleWatchReplay = async () => {
    const id = Number(replayGameId)
    if (!id) return

    setReplayState('downloading')
    try {
      const metaRes = await fetch(`/lol-replays/v1/metadata/${id}`)
      if (!metaRes.ok) {
        logger.error('[Replay] 获取元数据失败:', metaRes.status)
        setReplayState('error')
        return
      }
      const meta = await metaRes.json() as { state: string; downloadProgress: number; gameId: number }

      if (meta.state === 'watch') {
        setReplayState('launching')
        const res = await fetch(`/lol-replays/v1/rofls/${id}/watch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
        })
        setReplayState(res.ok ? 'ready' : 'error')
        if (res.ok) logger.info('[Replay] 开始播放 #%d ✓', id)
        else logger.error('[Replay] 播放失败:', await res.text())
        return
      }

      if (meta.state !== 'downloading') {
        await fetch(`/lol-replays/v1/rofls/${id}/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
        })
      }

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000))
        const checkRes = await fetch(`/lol-replays/v1/metadata/${id}`)
        if (!checkRes.ok) continue
        const checkMeta = await checkRes.json() as { state: string; downloadProgress: number }
        logger.info('[Replay] 下载中... %d%%', checkMeta.downloadProgress)

        if (checkMeta.state === 'watch') {
          setReplayState('launching')
          const res = await fetch(`/lol-replays/v1/rofls/${id}/watch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
          })
          setReplayState(res.ok ? 'ready' : 'error')
          if (res.ok) logger.info('[Replay] 下载完成，开始播放 #%d ✓', id)
          else logger.error('[Replay] 播放失败:', await res.text())
          return
        }
      }
      logger.warn('[Replay] 等待超时')
      setReplayState('error')
    } catch (err) {
      logger.error('[Replay] 异常:', err)
      setReplayState('error')
    }
  }

  return (
    <div className="sona-home">
      {/* SONA 标题 */}
      <h1 className="sona-home-brand">
        <span className="sona-home-brand-text">SONA-E</span>
      </h1>

      {/* 头像 + 粒子 */}
      <div className="sona-home-avatar-wrap">
        <ParticleCanvas />
        <div className="sona-home-avatar-glow" />
        <img
          className="sona-home-avatar"
          src={sonaIcon}
          alt="Sona-E"
          draggable={false}
        />
      </div>

      {/* 欢迎语 */}
      <div className="sona-home-welcome">
        <h2 className="sona-home-heading">{t('home.welcome')}</h2>
        <p className="sona-home-subtitle">
          {t('home.subtitle')}
        </p>
      </div>

      <section className="sona-home-search">
        <p className="sona-home-search-title">{t('home.matchTitle')}</p>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={searchRiotId}
              onChange={(v) => { setSearchRiotId(v); setSearchError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchMatch() }}
              placeholder={t('home.matchPlaceholder')}
            />
          </div>
          <SonaButton variant="primary" onClick={handleSearchMatch}>
            {t('home.search')}
          </SonaButton>
        </div>
        {searchError && <p className="sona-home-search-error">{searchError}</p>}
      </section>

      <section className="sona-home-search">
        <p className="sona-home-search-title">{t('home.replayTitle')}</p>
        <p className="sona-home-search-hint">{t('home.replayHint')}</p>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={replayGameId}
              onChange={(v) => { setReplayGameId(v); setReplayState('idle') }}
              placeholder={t('home.replayPlaceholder')}
            />
          </div>
          <SonaButton onClick={handleWatchReplay}>
            {{ idle: t('home.replayIdle'), downloading: t('home.replayDownloading'), ready: t('home.replayReady'), launching: t('home.replayLaunching'), error: t('home.replayError') }[replayState]}
          </SonaButton>
        </div>
      </section>

      <MatchHistoryModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        puuid={matchModalPuuid}
        playerName={matchModalName}
      />

      {/* 琴女语录 */}
      <p className="sona-home-quote">
        {t('home.quote')}
        <br />
        &nbsp;{t('home.quoteAuthor')}
      </p>
    </div>
  )
}
