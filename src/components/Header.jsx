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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.08)' }}>

        {/* LEFT — Séjours */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTripMenu(m => !m)}
            style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.4rem' }}
          >
            ✈️ Séjours
            <span style={{ fontSize: '.65rem', opacity: .7, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '1px 6px' }}>{trips.length}</span>
            <span style={{ fontSize: '.6rem', opacity: .6 }}>{showTripMenu ? '▴' : '▾'}</span>
          </button>

          {/* Dropdown séjours */}
          {showTripMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,.18)', minWidth: 260, overflow: 'hidden'
            }}>
              <div style={{ padding: '.6rem .85rem', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Mes séjours
              </div>

              {trips.map((t, i) => {
                const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
                const isActive = t.id === activeTrip?.id
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '.55rem .85rem', gap: '.6rem', background: isActive ? '#f8f7f3' : '#fff', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => { onSelectTrip(t.id); setShowTripMenu(false) }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.85rem', fontWeight: isActive ? 600 : 400, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      {t.startDate && (
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                          {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                          {' → '}
                          {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); onEditTrip(t); setShowTripMenu(false) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }}>✏️</button>
                      {trips.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); confirm(`Supprimer "${t.name}" ?`) && onDeleteTrip(t.id); setShowTripMenu(false) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }}>🗑</button>
                      )}
                    </div>
                  </div>
                )
              })}

              <button onClick={() => { onNewTrip(); setShowTripMenu(false) }}
                style={{ width: '100%', padding: '.65rem .85rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem', fontWeight: 500, color: 'var(--green)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                ＋ Nouveau séjour
              </button>
            </div>
          )}
        </div>

        {/* CENTER — App title + clock */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-.01em' }}>
            Vacances Aharone
          </div>
          <div style={{ marginTop: '.25rem' }}>
            <span className="clock-big" style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '.06em' }}>
              {time.local}
            </span>
            <span className="clock-utc" style={{ fontFamily: 'monospace', fontSize: '.75rem', opacity: .45, marginLeft: '.6rem' }}>
              UTC {time.utc}
            </span>
            {syncing && <span style={{ fontSize: '.65rem', opacity: .5, marginLeft: '.5rem' }}>☁️</span>}
          </div>
        </div>

        {/* RIGHT — Voyageurs + Déconnexion */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={onOpenVoyageurs}
            style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {voyageurs.slice(0,3).map((v, i) => (
                <div key={v.id} style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i === 0 ? 'var(--green-mid)' : '#6b6b99',
                  border: '2px solid rgba(255,255,255,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.65rem', fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? -8 : 0, zIndex: 3-i, position: 'relative'
                }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {voyageurs.length > 3 && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: '#fff', marginLeft: -8 }}>
                  +{voyageurs.length - 3}
                </div>
              )}
            </div>
            <span style={{ fontSize: '.78rem' }}>Voyageurs</span>
          </button>

          {/* Déconnexion en dessous */}
          {onSignOut && (
            <button onClick={onSignOut} style={{
              display: 'block', width: '100%', marginTop: '.3rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,.35)', fontSize: '.65rem',
              fontFamily: 'inherit', textAlign: 'center', padding: '2px 0'
            }}>
              {userEmail && <span style={{ fontSize: '.6rem', display: 'block', marginBottom: '1px', opacity: .7 }}>{userEmail}</span>}
              Déconnexion
            </button>
          )}
        </div>
      </div>

      {/* ── TRIP TABS ── */}
      <div className="trip-tabs-row" style={{ display: 'flex', gap: '.4rem', padding: '.6rem 1.25rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {trips.map((t, i) => {
          const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
          const isActive = t.id === activeTrip?.id
          return (
            <button key={t.id} onClick={() => onSelectTrip(t.id)} style={{
              background: isActive ? color : 'rgba(255,255,255,.08)',
              border: `1px solid ${isActive ? color : 'rgba(255,255,255,.15)'}`,
              borderRadius: 8, padding: '5px 14px', color: '#fff', cursor: 'pointer',
              fontSize: '.78rem', fontFamily: 'inherit', fontWeight: isActive ? 600 : 400,
              whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0
            }}>
              {t.name}
              {t.startDate && (
                <span style={{ fontSize: '.63rem', opacity: .7, marginLeft: '.4rem' }}>
                  {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Click outside to close dropdown */}
      {showTripMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowTripMenu(false)} />
      )}
    </header>
  )
}
