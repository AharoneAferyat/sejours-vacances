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

  // Show only email part before @, or first 12 chars of UID
  const displayUser = userEmail?.includes('@')
    ? userEmail.split('@')[0]
    : userEmail?.slice(0, 10)

  return (
    <header style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff' }}>

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
            ✈️ Séjours
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
            Vacances Aharone
          </div>
          <div style={{ marginTop: '.2rem' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 'clamp(.78rem, 2vw, 1.05rem)', letterSpacing: '.05em' }}>{time.local}</span>
            <span style={{ fontFamily: 'monospace', opacity: .4, marginLeft: '.5rem', fontSize: 'clamp(.65rem, 1.5vw, .78rem)' }}>UTC {time.utc}</span>
            {syncing && <span style={{ opacity: .4, marginLeft: '.35rem', fontSize: '.7rem' }}>☁️</span>}
          </div>
        </div>

        {/* RIGHT — Déconnexion (top) + Voyageurs (below) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
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
