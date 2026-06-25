import { useState, useEffect } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

export default function AppHeader({ trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip, voyageurs, onOpenVoyageurs, syncing, onSignOut }) {
  const [time, setTime] = useState({ local: '', utc: '' })

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
    <header style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', padding: '1rem 1.5rem' }}>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '.6rem' }}>
        <div>
          <button onClick={onNewTrip} style={{ background: 'rgba(255,255,255,.1)', border: '1px dashed rgba(255,255,255,.4)', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'inherit', fontWeight: 500 }}>
            ✈️ Gérer les séjours
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700 }}>
            Vacances Aharone
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
          <button onClick={onOpenVoyageurs} style={{ background: 'rgba(255,255,255,.1)', border: '1px dashed rgba(255,255,255,.4)', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'inherit', fontWeight: 500 }}>
            👥 Gérer les voyageurs
          </button>
          {onSignOut && (
            <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '.68rem', fontFamily: 'inherit', padding: 0 }}>
              Déconnexion
            </button>
          )}
        </div>
      </div>

      {/* Row 2 — Clock */}
      <div style={{ textAlign: 'center', marginBottom: '.7rem' }}>
        <span className="clock-big" style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '.08em' }}>
          {time.local}
        </span>
        <span className="clock-utc" style={{ fontFamily: 'monospace', fontSize: '.85rem', opacity: .55, marginLeft: '.75rem', letterSpacing: '.06em' }}>
          UTC {time.utc}
        </span>
        {syncing && <span style={{ fontSize: '.72rem', opacity: .6, marginLeft: '.75rem' }}>☁️ sync…</span>}
      </div>

      {/* Row 3 — Trip tabs */}
      <div className="trip-tabs-row" style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
        {trips.map((t, i) => {
          const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
          const isActive = t.id === activeTrip?.id
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={() => onSelectTrip(t.id)} style={{
                background: isActive ? color : 'rgba(255,255,255,.1)',
                border: `2px solid ${isActive ? color : 'rgba(255,255,255,.2)'}`,
                borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer',
                fontSize: '.82rem', fontFamily: 'inherit', fontWeight: isActive ? 600 : 400,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                transition: 'all .2s', minWidth: 100,
              }}>
                <span>{t.name}</span>
                {t.startDate && (
                  <span style={{ fontSize: '.63rem', opacity: .75, marginTop: 1 }}>
                    {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                    {' → '}
                    {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                  </span>
                )}
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button onClick={() => onEditTrip(t)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: '.68rem', padding: '1px 3px' }}>✏️</button>
                {trips.length > 1 && (
                  <button onClick={() => confirm(`Supprimer "${t.name}" ?`) && onDeleteTrip(t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: '.68rem', padding: '1px 3px' }}>🗑</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </header>
  )
}
