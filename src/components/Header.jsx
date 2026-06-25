import { useState, useEffect } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail
}) {
  const [time, setTime] = useState({ local: '', utc: '' })
  const [showTripMenu, setShowTripMenu] = useState(false)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime({
        local: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        utc: now.toUTCString().split(' ')[4]
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff' }}>

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(.4rem, 2vw, 1rem)', padding: 'clamp(.5rem, 2vw, .9rem) clamp(.6rem, 2.5vw, 1.25rem)', borderBottom: '1px solid rgba(255,255,255,.08)', flexWrap: 'wrap' }}>

        {/* LEFT — Séjours dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowTripMenu(m => !m)} style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 10, padding: '7px 12px', color: '#fff', cursor: 'pointer',
            fontSize: 'clamp(.72rem, 1.8vw, .82rem)', fontFamily: 'inherit', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '.35rem'
          }}>
            ✈️ Séjours
            <span style={{ fontSize: '.65rem', opacity: .7, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '1px 6px' }}>{trips.length}</span>
            <span style={{ fontSize: '.6rem', opacity: .6 }}>{showTripMenu ? '▴' : '▾'}</span>
          </button>

          {showTripMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,.18)', minWidth: 240, overflow: 'hidden'
            }}>
              <div style={{ padding: '.5rem .8rem', fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Mes séjours
              </div>
              {trips.map((t, i) => {
                const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
                const isActive = t.id === activeTrip?.id
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '.55rem .8rem', gap: '.55rem', background: isActive ? '#f8f7f3' : '#fff', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => { onSelectTrip(t.id); setShowTripMenu(false) }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.83rem', fontWeight: isActive ? 600 : 400, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      {t.startDate && <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>
                        {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>}
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button onClick={e => { e.stopPropagation(); onEditTrip(t); setShowTripMenu(false) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', padding: '2px 3px', color: 'var(--text-muted)' }}>✏️</button>
                      {trips.length > 1 && <button onClick={e => { e.stopPropagation(); confirm(`Supprimer "${t.name}" ?`) && onDeleteTrip(t.id); setShowTripMenu(false) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', padding: '2px 3px', color: 'var(--text-muted)' }}>🗑</button>}
                    </div>
                  </div>
                )
              })}
              <button onClick={() => { onNewTrip(); setShowTripMenu(false) }}
                style={{ width: '100%', padding: '.6rem .8rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem', fontWeight: 500, color: 'var(--green)', textAlign: 'left' }}>
                ＋ Nouveau séjour
              </button>
            </div>
          )}
        </div>

        {/* CENTER — Title + clock */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 700, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Vacances Aharone
          </div>
          <div style={{ marginTop: '.2rem', fontSize: 'clamp(.7rem, 2vw, .85rem)' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '.05em' }}>{time.local}</span>
            <span style={{ fontFamily: 'monospace', opacity: .45, marginLeft: '.5rem', fontSize: '.85em' }}>UTC {time.utc}</span>
            {syncing && <span style={{ opacity: .45, marginLeft: '.4rem' }}>☁️</span>}
          </div>
        </div>

        {/* RIGHT — Voyageurs + Déconnexion */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.25rem' }}>
          <button onClick={onOpenVoyageurs} style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 10, padding: '7px 12px', color: '#fff', cursor: 'pointer',
            fontSize: 'clamp(.72rem, 1.8vw, .82rem)', fontFamily: 'inherit', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '.45rem'
          }}>
            <div style={{ display: 'flex' }}>
              {voyageurs.slice(0,3).map((v, i) => (
                <div key={v.id} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: i === 0 ? '#1D9E75' : '#6b6b99',
                  border: '1.5px solid rgba(255,255,255,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.6rem', fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? -7 : 0, position: 'relative', zIndex: 3-i
                }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {voyageurs.length > 3 && (
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', color: '#fff', marginLeft: -7 }}>
                  +{voyageurs.length - 3}
                </div>
              )}
            </div>
            Voyageurs
          </button>
          {onSignOut && (
            <div style={{ textAlign: 'right' }}>
              {userEmail && <div style={{ fontSize: '.6rem', opacity: .4, marginBottom: '1px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>}
              <button onClick={onSignOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: '.65rem', fontFamily: 'inherit', padding: 0 }}>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TRIP TABS (always visible, scrollable) ── */}
      <div style={{ display: 'flex', gap: '.4rem', padding: '.55rem clamp(.6rem, 2.5vw, 1.25rem)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {trips.map((t, i) => {
          const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
          const isActive = t.id === activeTrip?.id
          return (
            <button key={t.id} onClick={() => onSelectTrip(t.id)} style={{
              background: isActive ? color : 'rgba(255,255,255,.08)',
              border: `1.5px solid ${isActive ? color : 'rgba(255,255,255,.15)'}`,
              borderRadius: 8, padding: '5px 13px', color: '#fff', cursor: 'pointer',
              fontSize: 'clamp(.72rem, 1.8vw, .8rem)', fontFamily: 'inherit',
              fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
              transition: 'all .15s', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
            }}>
              <span>{t.name}</span>
              {t.startDate && (
                <span style={{ fontSize: '.6rem', opacity: .72 }}>
                  {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                  {' → '}
                  {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {showTripMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowTripMenu(false)} />}
    </header>
  )
}
