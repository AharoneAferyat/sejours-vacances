import { useState, useEffect } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

function getHeaderGradient() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMonth()

  const isSummer = m >= 5 && m <= 8
  const isAutumn = m >= 9 && m <= 10
  const isWinter = m === 11 || m <= 1
  const isSpring = m >= 2 && m <= 4

  if (h >= 0 && h < 5) {
    if (isWinter) return 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #1a0a2e 100%)'
    return 'linear-gradient(135deg, #070714 0%, #0d1533 50%, #0a0d1f 100%)'
  }
  if (h >= 5 && h < 7) {
    if (isWinter) return 'linear-gradient(135deg, #1a1030 0%, #3d1c5e 40%, #7a3b1e 100%)'
    if (isSpring) return 'linear-gradient(135deg, #1a1040 0%, #6b2d6b 40%, #d4722a 100%)'
    if (isSummer) return 'linear-gradient(135deg, #1a1535 0%, #8b3a62 40%, #e8852f 100%)'
    return 'linear-gradient(135deg, #1a1030 0%, #5c2d6b 40%, #c4622a 100%)'
  }
  if (h >= 7 && h < 12) {
    if (isWinter) return 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 50%, #4a7fa8 100%)'
    if (isSpring) return 'linear-gradient(135deg, #1a4a2e 0%, #2d7a4f 50%, #4aab72 100%)'
    if (isSummer) return 'linear-gradient(135deg, #1a3a6e 0%, #1e6bb5 50%, #38a0d4 100%)'
    return 'linear-gradient(135deg, #2a3a50 0%, #3d5a78 50%, #5a7fa0 100%)'
  }
  if (h >= 12 && h < 17) {
    if (isWinter) return 'linear-gradient(135deg, #1c3550 0%, #2a5478 50%, #1e3a5f 100%)'
    if (isSpring) return 'linear-gradient(135deg, #0f4a2a 0%, #1a7a45 50%, #0d5e38 100%)'
    if (isSummer) return 'linear-gradient(135deg, #0a3a7a 0%, #0f5eb5 50%, #0a4a8a 100%)'
    return 'linear-gradient(135deg, #1e2e45 0%, #2d4a6a 50%, #1a3050 100%)'
  }
  if (h >= 17 && h < 20) {
    if (isWinter) return 'linear-gradient(135deg, #2a1a0a 0%, #6b3a0f 40%, #a05a1a 100%)'
    if (isSpring) return 'linear-gradient(135deg, #1a2a0a 0%, #5a7a1a 40%, #c4a020 100%)'
    if (isSummer) return 'linear-gradient(135deg, #1a1a0a 0%, #8b4a0a 40%, #d4820a 100%)'
    return 'linear-gradient(135deg, #1a1208 0%, #5a3010 40%, #9a5818 100%)'
  }
  if (h >= 20 && h < 23) {
    if (isWinter) return 'linear-gradient(135deg, #0d0d25 0%, #1a1040 50%, #2a0a3a 100%)'
    if (isSummer) return 'linear-gradient(135deg, #0a0a20 0%, #1a1245 50%, #2d0d30 100%)'
    return 'linear-gradient(135deg, #0d0d22 0%, #18103c 50%, #260c2e 100%)'
  }
  return 'linear-gradient(135deg, #07071a 0%, #0d1030 50%, #0a0820 100%)'
}

export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail, onOpenGlobalBudget, isAdmin, onOpenAdmin
}) {
  const [time, setTime] = useState({ local: '', utc: '', dateFR: '', dateEN: '' })
  const [headerBg, setHeaderBg] = useState(getHeaderGradient())
  const [showTripMenu, setShowTripMenu] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const menuItemStyle = {
    width: '100%', padding: '.65rem .9rem', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '.82rem', fontWeight: 500, color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: '.6rem', textAlign: 'left'
  }

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const daysFR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
      const monthsFR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      const daysEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const nth = (d) => { if (d > 3 && d < 21) return 'th'; switch (d % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' } }
      const nowUTC = new Date(now.toISOString())
      setTime({
        local: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        utc: nowUTC.toUTCString().split(' ')[4],
        dateFR: `${daysFR[now.getDay()]} ${now.getDate()} ${monthsFR[now.getMonth()]} ${now.getFullYear()}`,
        dateEN: `${daysEN[nowUTC.getUTCDay()]} ${nowUTC.getUTCDate()}${nth(nowUTC.getUTCDate())} ${monthsEN[nowUTC.getUTCMonth()]} ${nowUTC.getUTCFullYear()}`
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setHeaderBg(getHeaderGradient())
    const id = setInterval(() => setHeaderBg(getHeaderGradient()), 60000)
    return () => clearInterval(id)
  }, [])

  const displayUser = userEmail?.includes('@')
    ? userEmail.split('@')[0]
    : userEmail?.slice(0, 10)

  return (
    <header style={{ background: headerBg, transition: 'background 2s ease', color: '#fff', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', top: '-60%', right: '-10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── ROW 1: Séjours | Title + Clock | Compte ── */}
      <div className="header-row1" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'start', gap: 'clamp(.4rem, 2vw, 1rem)', padding: 'clamp(.65rem, 2vw, 1rem) clamp(.6rem, 2.5vw, 1.25rem)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>

        {/* LEFT — Séjours dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTripMenu(m => !m)} style={{
            background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 12, padding: '8px 14px', color: '#fff', cursor: 'pointer',
            fontSize: 'clamp(.7rem, 1.8vw, .82rem)', fontFamily: 'inherit', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '.4rem', whiteSpace: 'nowrap'
          }}>
            🥾 <span className="trips-label-full">Séjours</span>
            <span style={{ fontSize: '.62rem', opacity: .7, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '1px 6px' }}>{trips.length}</span>
            <span style={{ fontSize: '.6rem', opacity: .5 }}>{showTripMenu ? '▴' : '▾'}</span>
          </button>

          {showTripMenu && (
            <div style={{
              position: 'fixed', top: 56, left: 10, zIndex: 300,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,.2)', minWidth: 220, maxWidth: 'calc(100vw - 20px)', overflow: 'hidden'
            }}>
              <div style={{ padding: '.5rem .8rem', fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Mes séjours
              </div>
              {trips.map((t, i) => {
                const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
                const isActive = t.id === activeTrip?.id
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '.5rem .8rem', gap: '.5rem', background: isActive ? '#f8f7f3' : '#fff', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => { onSelectTrip(t.id); setShowTripMenu(false) }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.83rem', fontWeight: isActive ? 600 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      {t.startDate && <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>
                        {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); onEditTrip(t); setShowTripMenu(false) }}
                        title="Modifier" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', padding: '2px 3px', color: 'var(--text-muted)', borderRadius: 4 }}>✏️</button>
                      {trips.length > 1 && <button onClick={e => { e.stopPropagation(); confirm(`Supprimer "${t.name}" ?`) && onDeleteTrip(t.id); setShowTripMenu(false) }}
                        title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', padding: '2px 3px', color: 'var(--text-muted)', borderRadius: 4 }}>🗑</button>}
                    </div>
                  </div>
                )
              })}
              <button onClick={() => { onNewTrip(); setShowTripMenu(false) }}
                style={{ width: '100%', padding: '.6rem .8rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem', fontWeight: 600, color: 'var(--green)', textAlign: 'left' }}>
                ＋ Nouveau séjour
              </button>
            </div>
          )}
        </div>

        {/* CENTER — Title + clock, glass pill */}
        <div style={{ textAlign: 'center', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(.92rem, 3vw, 1.5rem)', fontWeight: 700, lineHeight: 1.1,
            marginBottom: '.5rem',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,.75) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            Séjours Vacances
          </div>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '.1rem',
            background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 16,
            padding: 'clamp(.35rem, 1.2vw, .6rem) clamp(.7rem, 3vw, 1.5rem)'
          }}>
            <span className="hide-on-tiny" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 'clamp(.7rem, 1.8vw, .92rem)', letterSpacing: '.03em', opacity: .9 }}>{time.dateFR}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 300, fontSize: 'clamp(1.05rem, 3.2vw, 1.6rem)', letterSpacing: '.04em' }}>{time.local}</span>
              {syncing && <span style={{ opacity: .4, fontSize: '.7rem' }}>☁️</span>}
            </div>
            <span className="hide-on-tiny" style={{ fontFamily: 'monospace', opacity: .45, fontSize: 'clamp(.6rem, 1.4vw, .74rem)', fontWeight: 500, letterSpacing: '.03em', marginTop: '.05rem' }}>UTC {time.utc} · {time.dateEN}</span>
          </div>
        </div>

        {/* RIGHT — Compact account menu, glass pill */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowAccountMenu(m => !m)} style={{
            background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 30, padding: '5px 10px 5px 5px', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '.4rem', fontFamily: 'inherit'
          }}>
            <div style={{ display: 'flex' }}>
              {voyageurs.slice(0, 2).map((v, i) => (
                <div key={v.id} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: i === 0 ? '#1D9E75' : '#6b7cc4',
                  border: '2px solid rgba(255,255,255,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.65rem', fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: 3 - i
                }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {voyageurs.length > 2 && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', color: '#fff', marginLeft: -8 }}>
                  +{voyageurs.length - 2}
                </div>
              )}
            </div>
            <span style={{ fontSize: '.7rem', opacity: .55 }}>{showAccountMenu ? '▴' : '▾'}</span>
          </button>

          {showAccountMenu && (
            <div style={{
              position: 'fixed', top: 56, right: 10, zIndex: 300,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,.22)', minWidth: 200, maxWidth: 'calc(100vw - 24px)', overflow: 'hidden'
            }}>
              {displayUser && (
                <div style={{ padding: '.75rem .9rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #f8f7fc 0%, #f3f0f8 100%)' }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text)' }}>{displayUser}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--text-muted)' }}>Connecté</div>
                </div>
              )}

              <button onClick={() => { onOpenVoyageurs(); setShowAccountMenu(false) }} style={menuItemStyle}>
                <span style={{ fontSize: '1rem' }}>👥</span> Voyageurs
              </button>

              {onOpenGlobalBudget && (
                <button onClick={() => { onOpenGlobalBudget(); setShowAccountMenu(false) }} style={menuItemStyle}>
                  <span style={{ fontSize: '1rem' }}>💰</span> Budget global
                </button>
              )}

              {isAdmin && onOpenAdmin && (
                <button onClick={() => { onOpenAdmin(); setShowAccountMenu(false) }} style={{ ...menuItemStyle, color: 'var(--amber)' }}>
                  <span style={{ fontSize: '1rem' }}>⚙️</span> Administration
                </button>
              )}

              {onSignOut && (
                <button onClick={() => { onSignOut(); setShowAccountMenu(false) }} style={{ ...menuItemStyle, color: 'var(--red)', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1rem' }}>🚪</span> Déconnexion
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: Trip tabs with edit/delete ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '.35rem', padding: '.5rem clamp(.6rem, 2.5vw, 1.25rem)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
        {trips.map((t, i) => {
          const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
          const isActive = t.id === activeTrip?.id
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <button onClick={() => onSelectTrip(t.id)} style={{
                background: isActive ? color : 'rgba(255,255,255,.08)',
                border: `1.5px solid ${isActive ? color : 'rgba(255,255,255,.15)'}`,
                borderRadius: '8px', padding: '5px 12px', color: '#fff', cursor: 'pointer',
                fontSize: 'clamp(.7rem, 1.8vw, .8rem)', fontFamily: 'inherit',
                fontWeight: isActive ? 600 : 400, transition: 'all .15s',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
              }}>
                <span>{t.name}</span>
                {t.startDate && (
                  <span style={{ fontSize: '.58rem', opacity: .72 }}>
                    {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                    {' → '}
                    {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                  </span>
                )}
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 2 }}>
                <button onClick={() => onEditTrip(t)} title="Modifier"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', padding: '2px 3px', color: 'rgba(255,255,255,.45)', lineHeight: 1 }}>✏️</button>
                {trips.length > 1 && (
                  <button onClick={() => confirm(`Supprimer "${t.name}" ?`) && onDeleteTrip(t.id)} title="Supprimer"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', padding: '2px 3px', color: 'rgba(255,255,255,.35)', lineHeight: 1 }}>🗑</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {(showTripMenu || showAccountMenu) && <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => { setShowTripMenu(false); setShowAccountMenu(false) }} />}
    </header>
  )
}
