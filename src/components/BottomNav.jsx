import { useState } from 'react'

function scrollAndTab(tabName, setTab) {
  setTab(tabName)
  setTimeout(() => {
    const el = document.getElementById('section-planning')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 30)
}

export default function BottomNav({
  tab, setTab, onOpenVoyageurs, onOpenGlobalBudget, onOpenAI,
  isAdmin, onOpenAdmin, onSignOut, userEmail
}) {
  const [showMore, setShowMore] = useState(false)
  const displayUser = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0, 12)

  return (
    <>
      <nav className="bottom-nav">
        {/* Planning — onglet principal */}
        <button className={`bn-item${tab === 'planning' ? ' active' : ''}`}
          onClick={() => scrollAndTab('planning', setTab)}>
          <span className="bn-icon">📋</span>Planning
        </button>

        {/* Budget */}
        <button className={`bn-item${tab === 'budget' ? ' active' : ''}`}
          onClick={() => scrollAndTab('budget', setTab)}>
          <span className="bn-icon">💰</span>Budget
        </button>

        {/* Voyageurs */}
        <button className="bn-item" onClick={onOpenVoyageurs}>
          <span className="bn-icon">👥</span>Voyageurs
        </button>

        {/* Plus — tout le reste */}
        <button className="bn-item" onClick={() => setShowMore(true)}>
          <span className="bn-icon">···</span>Plus
        </button>
      </nav>

      {showMore && (
        <div className="bn-sheet-overlay" onClick={e => e.target === e.currentTarget && setShowMore(false)}>
          <div className="bn-sheet">
            <div className="bn-sheet-handle" />

            {displayUser && (
              <div style={{ padding: '.5rem 1.1rem .75rem', borderBottom: '1px solid var(--border)', marginBottom: '.25rem' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{displayUser}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Connecté</div>
              </div>
            )}

            <button className="bn-sheet-item" onClick={() => { scrollAndTab('infos', setTab); setShowMore(false) }}>
              <span>ℹ️</span> Infos du séjour
            </button>

            <button className="bn-sheet-item" onClick={() => { onOpenAI(); setShowMore(false) }}>
              <span>🤖</span> IA Randos
            </button>

            {onOpenGlobalBudget && (
              <button className="bn-sheet-item" onClick={() => { onOpenGlobalBudget(); setShowMore(false) }}>
                <span>🌍</span> Budget global
              </button>
            )}

            {isAdmin && onOpenAdmin && (
              <button className="bn-sheet-item" style={{ color: 'var(--amber)' }}
                onClick={() => { onOpenAdmin(); setShowMore(false) }}>
                <span>⚙️</span> Administration
              </button>
            )}

            <button className="bn-sheet-item" style={{ color: 'var(--red)', borderTop: '1px solid var(--border)', marginTop: '.25rem' }}
              onClick={() => { if (onSignOut) { onSignOut(); setShowMore(false) } }}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  )
}
