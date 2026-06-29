import { useState, useEffect } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']
// Gradient dynamique selon saison + heure
function getHeaderGradient() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMonth() // 0=jan

  // Saison
  const isSummer = m >= 5 && m <= 8    // juin-sept
  const isAutumn = m >= 9 && m <= 10   // oct-nov
  const isWinter = m === 11 || m <= 1  // déc-fév
  const isSpring = m >= 2 && m <= 4    // mars-mai

  // Nuit profonde 0h-5h
  if (h >= 0 && h < 5) {
    if (isWinter) return 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #1a0a2e 100%)'
    return 'linear-gradient(135deg, #070714 0%, #0d1533 50%, #0a0d1f 100%)'
  }
  // Aube 5h-7h
  if (h >= 5 && h < 7) {
    if (isWinter) return 'linear-gradient(135deg, #1a1030 0%, #3d1c5e 40%, #7a3b1e 100%)'
    if (isSpring) return 'linear-gradient(135deg, #1a1040 0%, #6b2d6b 40%, #d4722a 100%)'
    if (isSummer) return 'linear-gradient(135deg, #1a1535 0%, #8b3a62 40%, #e8852f 100%)'
    return 'linear-gradient(135deg, #1a1030 0%, #5c2d6b 40%, #c4622a 100%)'
  }
  // Matin 7h-12h
  if (h >= 7 && h < 12) {
    if (isWinter) return 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 50%, #4a7fa8 100%)'
    if (isSpring) return 'linear-gradient(135deg, #1a4a2e 0%, #2d7a4f 50%, #4aab72 100%)'
    if (isSummer) return 'linear-gradient(135deg, #1a3a6e 0%, #1e6bb5 50%, #38a0d4 100%)'
    return 'linear-gradient(135deg, #2a3a50 0%, #3d5a78 50%, #5a7fa0 100%)'
  }
  // Après-midi 12h-17h
  if (h >= 12 && h < 17) {
    if (isWinter) return 'linear-gradient(135deg, #1c3550 0%, #2a5478 50%, #1e3a5f 100%)'
    if (isSpring) return 'linear-gradient(135deg, #0f4a2a 0%, #1a7a45 50%, #0d5e38 100%)'
    if (isSummer) return 'linear-gradient(135deg, #0a3a7a 0%, #0f5eb5 50%, #0a4a8a 100%)'
    return 'linear-gradient(135deg, #1e2e45 0%, #2d4a6a 50%, #1a3050 100%)'
  }
  // Soirée dorée 17h-20h
  if (h >= 17 && h < 20) {
    if (isWinter) return 'linear-gradient(135deg, #2a1a0a 0%, #6b3a0f 40%, #a05a1a 100%)'
    if (isSpring) return 'linear-gradient(135deg, #1a2a0a 0%, #5a7a1a 40%, #c4a020 100%)'
    if (isSummer) return 'linear-gradient(135deg, #1a1a0a 0%, #8b4a0a 40%, #d4820a 100%)'
    return 'linear-gradient(135deg, #1a1208 0%, #5a3010 40%, #9a5818 100%)'
  }
  // Nuit tombante 20h-23h
  if (h >= 20 && h < 23) {
    if (isWinter) return 'linear-gradient(135deg, #0d0d25 0%, #1a1040 50%, #2a0a3a 100%)'
    if (isSummer) return 'linear-gradient(135deg, #0a0a20 0%, #1a1245 50%, #2d0d30 100%)'
    return 'linear-gradient(135deg, #0d0d22 0%, #18103c 50%, #260c2e 100%)'
  }
  // 23h
  return 'linear-gradient(135deg, #07071a 0%, #0d1030 50%, #0a0820 100%)'
}



export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail, onOpenGlobalBudget, isAdmin, onOpenAdmin
}) {
  const [time, setTime] = useState({ local: '', utc: '', dateFR: '', dateEN: '' })
  const [headerBg, setHeaderBg] = useState(getHeaderGradient())
  const [showTripMenu, setShowTripMenu] = useState(false)

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

  // Show only email part before @, or first 12 chars of UID
  const displayUser = userEmail?.includes('@')
    ? userEmail.split('@')[0]
    : userEmail?.slice(0, 10)

  return (
    <header style={{ background: headerBg, transition: 'background 2s ease', color: '#fff' }}>

      {/* ── ROW 1: Séjours | Title + Clock | Déconnexion + Voyageurs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'start', gap: 'clamp(.4rem, 2vw, 1rem)', padding: 'clamp(.5rem, 2vw, .85rem) clamp(.6rem, 2.5vw, 1.25rem)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>

        {/* LEFT — Séjours dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTripMenu(m => !m)} style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 10, padding: '7px 12px', color: '#fff', cursor: 'pointer',
            fontSize: 'clamp(.72rem, 1.8vw, .82rem)', fontFamily: 'inherit', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '.35rem', whiteSpace: 'nowrap'
          }}>
            🏔️ Séjours
            <span style={{ fontSize: '.6rem', opacity: .65, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '1px 5px' }}>{trips.length}</span>
            <span style={{ fontSize: '.6rem', opacity: .5 }}>{showTripMenu ? '▴' : '▾'}</span>
          </button>

          {showTripMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,.2)', minWidth: 240, overflow: 'hidden'
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

        {/* CENTER — Title + clock */}
        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(.95rem, 3vw, 1.5rem)', fontWeight: 700, lineHeight: 1.1 }}>
            Séjours Vacances
          </div>
          <div style={{ marginTop: '.3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.08rem' }}>
            {/* Date FR — bien visible, au-dessus */}
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 'clamp(.82rem, 2vw, 1rem)', letterSpacing: '.03em', opacity: .95 }}>{time.dateFR}</span>
            {/* Heure locale — grosse */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 'clamp(1.2rem, 3.5vw, 1.7rem)', letterSpacing: '.08em' }}>{time.local}</span>
              {syncing && <span style={{ opacity: .4, fontSize: '.7rem' }}>☁️</span>}
            </div>
            {/* UTC + date EN — discrets en dessous */}
            <span style={{ fontFamily: 'monospace', opacity: .5, fontSize: 'clamp(.68rem, 1.6vw, .82rem)', fontWeight: 500, letterSpacing: '.04em', marginTop: '.1rem' }}>UTC {time.utc} · {time.dateEN}</span>
          </div>
        </div>

        {/* RIGHT — Déconnexion (top) + Voyageurs (below) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
          {/* Bouton admin — visible uniquement pour l'admin */}
          {isAdmin && onOpenAdmin && (
            <button onClick={onOpenAdmin} style={{
              background: 'rgba(255,200,0,.15)', border: '1px solid rgba(255,200,0,.3)',
              borderRadius: 8, padding: '5px 11px', color: 'rgba(255,220,80,.95)', cursor: 'pointer',
              fontSize: 'clamp(.68rem, 1.6vw, .75rem)', fontFamily: 'inherit', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '.3rem', whiteSpace: 'nowrap'
            }}>
              ⚙️ Admin
            </button>
          )}

          {/* Déconnexion — top right, most visible */}
          {onSignOut && (
            <button onClick={onSignOut} style={{
              background: 'rgba(255,60,60,.15)', border: '1px solid rgba(255,100,100,.25)',
              borderRadius: 8, padding: '5px 11px', color: 'rgba(255,180,180,.9)', cursor: 'pointer',
              fontSize: 'clamp(.68rem, 1.6vw, .75rem)', fontFamily: 'inherit', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '.3rem', whiteSpace: 'nowrap'
            }}>
              {displayUser && <span style={{ opacity: .7 }}>{displayUser}</span>}
              {displayUser && <span style={{ opacity: .4 }}>·</span>}
              Déconnexion
            </button>
          )}

          {/* Budget global */}
          {onOpenGlobalBudget && (
            <button onClick={onOpenGlobalBudget} style={{
              background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 8, padding: '5px 11px', color: '#fff', cursor: 'pointer',
              fontSize: 'clamp(.68rem, 1.6vw, .75rem)', fontFamily: 'inherit', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '.3rem', whiteSpace: 'nowrap'
            }}>
              💰 Budget global
            </button>
          )}

          {/* Voyageurs */}
          <button onClick={onOpenVoyageurs} style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 8, padding: '5px 11px', color: '#fff', cursor: 'pointer',
            fontSize: 'clamp(.68rem, 1.6vw, .75rem)', fontFamily: 'inherit', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '.4rem', whiteSpace: 'nowrap'
          }}>
            <div style={{ display: 'flex' }}>
              {voyageurs.slice(0,3).map((v, i) => (
                <div key={v.id} style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: i === 0 ? '#1D9E75' : '#6b7cc4',
                  border: '1.5px solid rgba(255,255,255,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.58rem', fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? -6 : 0, position: 'relative', zIndex: 3-i
                }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {voyageurs.length > 3 && (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.52rem', color: '#fff', marginLeft: -6 }}>
                  +{voyageurs.length - 3}
                </div>
              )}
            </div>
            👥 Voyageurs
          </button>
        </div>
      </div>

      {/* ── ROW 2: Trip tabs with edit/delete ── */}
      <div style={{ display: 'flex', gap: '.35rem', padding: '.5rem clamp(.6rem, 2.5vw, 1.25rem)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
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
              {/* Edit/delete - small, no background */}
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

      {showTripMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowTripMenu(false)} />}
    </header>
  )
}
