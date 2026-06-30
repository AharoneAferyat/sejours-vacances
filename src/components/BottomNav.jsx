import { useState } from 'react'

export default function BottomNav({
  tab, setTab, onOpenVoyageurs, onOpenGlobalBudget, onOpenAI,
  isAdmin, onOpenAdmin, onSignOut, userEmail, trip
}) {
  const [showMore, setShowMore] = useState(false)

  const displayUser = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0, 10)

  return (
    <>
      <nav className="bottom-nav">
        <button className={`bn-item${tab === 'planning' ? ' active' : ''}`} onClick={() => setTab('planning')}>
          <span className="bn-icon">📋</span>
          Planning
        </button>
        <button className="bn-item" onClick={onOpenVoyageurs}>
          <span className="bn-icon">👥</span>
          Voyageurs
        </button>
        <button className={`bn-item${tab === 'budget' ? ' active' : ''}`} onClick={() => setTab('budget')}>
          <span className="bn-icon">💰</span>
          Budget
        </button>
        <button className="bn-item" onClick={() => setShowMore(true)}>
          <span className="bn-icon">⋯</span>
          Plus
        </button>
      </nav>

      {showMore && (
        <div className="bn-sheet-overlay" onClick={e => e.target === e.currentTarget && setShowMore(false)}>
          <div className="bn-sheet">
            <div className="bn-sheet-handle" />

            {displayUser && (
              <div style={{ padding: '.5rem 1.1rem .75rem', borderBottom: '1px solid var(--border)', marginBottom: '.3rem' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{displayUser}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Connecté</div>
              </div>
            )}

            <button className="bn-sheet-item" onClick={() => { setTab('infos'); setShowMore(false) }}>
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
              <button className="bn-sheet-item" style={{ color: 'var(--amber)' }} onClick={() => { onOpenAdmin(); setShowMore(false) }}>
                <span>⚙️</span> Administration
              </button>
            )}

            {onSignOut && (
              <button className="bn-sheet-item" style={{ color: 'var(--red)', borderTop: '1px solid var(--border)', marginTop: '.3rem' }}
                onClick={() => { onSignOut(); setShowMore(false) }}>
                <span>🚪</span> Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
