import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

function getSeasonTheme() {
  const m = new Date().getMonth()
  if (m >= 2 && m <= 4) return { // Printemps
    bg: 'linear-gradient(160deg, #2F8F6B 0%, #3aaa80 40%, #4fc49a 100%)',
    accent: '#2F8F6B', card: 'rgba(234,248,238,0.15)'
  }
  if (m >= 5 && m <= 8) return { // Été
    bg: 'linear-gradient(160deg, #0A7EA4 0%, #1a9eca 40%, #2db8e8 100%)',
    accent: '#0A7EA4', card: 'rgba(216,240,255,0.15)'
  }
  if (m >= 9 && m <= 10) return { // Automne
    bg: 'linear-gradient(160deg, #8F4E20 0%, #b56228 40%, #d4883c 100%)',
    accent: '#8F4E20', card: 'rgba(255,241,220,0.15)'
  }
  return { // Hiver
    bg: 'linear-gradient(160deg, #275D9C 0%, #3572ba 40%, #4d8ed6 100%)',
    accent: '#275D9C', card: 'rgba(238,245,255,0.15)'
  }
}

function getHourOverlay() {
  const h = new Date().getHours()
  if (h >= 5 && h < 8) return 'rgba(255,246,229,0.12)'   // Aube
  if (h >= 8 && h < 12) return 'rgba(255,255,255,0.06)'  // Matin
  if (h >= 12 && h < 17) return 'rgba(0,0,0,0)'          // Midi
  if (h >= 17 && h < 20) return 'rgba(255,180,80,0.12)'  // Soir
  return 'rgba(20,35,58,0.35)'                             // Nuit
}

export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail,
  onOpenGlobalBudget, isAdmin, onOpenAdmin
}) {
  const [time, setTime] = useState({ local: '', dateFR: '', utc: '' })
  const [theme, setTheme] = useState(getSeasonTheme())
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileTrips, setShowMobileTrips] = useState(false)
  const mobileRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const days = ['dim','lun','mar','mer','jeu','ven','sam']
      const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      setTime({
        local: now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
        dateFR: `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
        utc: new Date(now.toISOString()).toUTCString().split(' ')[4]
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTheme(getSeasonTheme()), 60000)
    return () => clearInterval(id)
  }, [])

  // Ferme menus mobile au clic dehors
  useEffect(() => {
    const handler = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setShowMobileMenu(false)
        setShowMobileTrips(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayUser = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0, 14)
  const bg = `${theme.bg}`

  // ── SIDEBAR DESKTOP ──────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="app-sidebar" style={{ background: bg }}>
      <div style={{ position: 'absolute', inset: 0, background: getHourOverlay(), pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-30%', right: '-20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="app-sidebar-inner" style={{ position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🥾</div>
          <div className="sidebar-logo-text">Séjours<br/>Vacances</div>
        </div>

        {/* Horloge */}
        <div className="sidebar-clock">
          <div className="sidebar-date">{time.dateFR}</div>
          <div className="sidebar-time">{time.local}</div>
          <div className="sidebar-utc">UTC {time.utc}</div>
        </div>

        {/* Séjours */}
        <div className="sidebar-trip-section">
          <div className="sidebar-section-label">Séjours</div>
          {trips.map((t, i) => {
            const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
            const isActive = t.id === activeTrip?.id
            return (
              <div key={t.id} className={`sidebar-trip-item${isActive ? ' active' : ''}`}
                onClick={() => onSelectTrip(t.id)}>
                <div className="sidebar-trip-dot" style={{ background: color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sidebar-trip-name">{t.name}</div>
                  {t.startDate && <div className="sidebar-trip-date">
                    {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                  </div>}
                </div>
                <div className="sidebar-trip-actions">
                  <button className="sidebar-trip-action" onClick={e => { e.stopPropagation(); onEditTrip(t) }}>✏️</button>
                  {trips.length > 1 && <button className="sidebar-trip-action" onClick={e => { e.stopPropagation(); confirm(`Supprimer "${t.name}" ?`) && onDeleteTrip(t.id) }}>🗑</button>}
                </div>
              </div>
            )
          })}
          <button className="sidebar-new-trip" onClick={onNewTrip}>＋ Nouveau séjour</button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <button className="sidebar-nav-item" onClick={onOpenVoyageurs}>
            <span className="sidebar-nav-icon">👥</span> Voyageurs
          </button>
          {onOpenGlobalBudget && (
            <button className="sidebar-nav-item" onClick={onOpenGlobalBudget}>
              <span className="sidebar-nav-icon">💰</span> Budget global
            </button>
          )}
          {isAdmin && onOpenAdmin && (
            <button className="sidebar-nav-item admin" onClick={onOpenAdmin}>
              <span className="sidebar-nav-icon">⚙️</span> Administration
            </button>
          )}
          <button className="sidebar-nav-item danger" onClick={onSignOut}>
            <span className="sidebar-nav-icon">→</span> Déconnexion
          </button>

          {/* User */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">{displayUser?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="sidebar-username">{displayUser}</div>
              <div className="sidebar-userstatus">Connecté{syncing ? ' · ☁️' : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )

  // ── TOP BAR MOBILE ───────────────────────────────────────────────────────
  const MobileTopBar = () => (
    <div ref={mobileRef}>
      <div className="mobile-topbar" style={{ background: bg }}>
        <div style={{ position: 'absolute', inset: 0, background: getHourOverlay(), pointerEvents: 'none' }} />
        <div className="mobile-topbar-left" style={{ position: 'relative', zIndex: 1 }}>
          <button className="mobile-topbar-trip" onClick={() => { setShowMobileTrips(m => !m); setShowMobileMenu(false) }}>
            🥾 {activeTrip?.name || 'Séjours'}
            <span style={{ fontSize: '.6rem', opacity: .6 }}>{showMobileTrips ? '▴' : '▾'}</span>
          </button>
        </div>
        <div className="mobile-topbar-time" style={{ position: 'relative', zIndex: 1 }}>{time.local}</div>
        <button className="mobile-topbar-avatar" style={{ position: 'relative', zIndex: 1 }}
          onClick={() => { setShowMobileMenu(m => !m); setShowMobileTrips(false) }}>
          {displayUser?.charAt(0).toUpperCase()}
        </button>
      </div>

      {/* Dropdown séjours mobile */}
      {showMobileTrips && (
        <div style={{ position: 'fixed', top: 52, left: 12, right: 12, zIndex: 800, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,.15)', overflow: 'hidden', border: '1px solid rgba(0,0,0,.08)' }}>
          <div style={{ padding: '.45rem .85rem', fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Mes séjours</div>
          {trips.map((t, i) => {
            const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
            const isActive = t.id === activeTrip?.id
            return (
              <div key={t.id}
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .85rem', background: isActive ? '#f8f7f3' : '#fff', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => { onSelectTrip(t.id); setShowMobileTrips(false) }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: isActive ? 600 : 400 }}>{t.name}</div>
                  {t.startDate && <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</div>}
                </div>
              </div>
            )
          })}
          <button style={{ width: '100%', padding: '.6rem .85rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 600, color: 'var(--accent)', textAlign: 'left' }}
            onClick={() => { onNewTrip(); setShowMobileTrips(false) }}>＋ Nouveau séjour</button>
        </div>
      )}

      {/* Dropdown compte mobile */}
      {showMobileMenu && (
        <div style={{ position: 'fixed', top: 52, right: 12, zIndex: 800, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,.15)', overflow: 'hidden', border: '1px solid rgba(0,0,0,.08)', minWidth: 220 }}>
          <div style={{ padding: '.65rem .9rem', borderBottom: '1px solid var(--border)', background: '#f8f7f3' }}>
            <div style={{ fontSize: '.83rem', fontWeight: 600 }}>{displayUser}</div>
            <div style={{ fontSize: '.67rem', color: 'var(--text-muted)' }}>Connecté</div>
          </div>
          {[
            { icon: '👥', label: 'Voyageurs', action: onOpenVoyageurs },
            onOpenGlobalBudget && { icon: '💰', label: 'Budget global', action: onOpenGlobalBudget },
            isAdmin && onOpenAdmin && { icon: '⚙️', label: 'Administration', action: onOpenAdmin, color: 'var(--amber)' },
            { icon: '→', label: 'Déconnexion', action: onSignOut, color: 'var(--red)' },
          ].filter(Boolean).map((item, i) => (
            <button key={i}
              style={{ width: '100%', padding: '.65rem .9rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 500, color: item.color || 'var(--text)', display: 'flex', alignItems: 'center', gap: '.55rem', textAlign: 'left', borderTop: item.color === 'var(--red)' ? '1px solid var(--border)' : 'none' }}
              onClick={() => { item.action?.(); setShowMobileMenu(false) }}>
              <span style={{ width: 22, textAlign: 'center' }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <Sidebar />
      <MobileTopBar />
    </>
  )
}
