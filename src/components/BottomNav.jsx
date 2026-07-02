import { useState } from 'react'

export default function BottomNav({ tab, setTab, onOpenVoyageurs, onOpenGlobalBudget, isAdmin, onOpenAdmin, onSignOut, userEmail }) {
  const [showMore, setShowMore] = useState(false)
  const displayUser = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0,12)

  const go = (t) => { setTab(t); setShowMore(false) }

  return (
    <>
      <nav className="bottom-nav">
        <button className={`bn-item${tab==='dashboard'?' active':''}`} onClick={()=>go('dashboard')}>
          <span className="bn-icon">🏠</span>Accueil
        </button>
        <button className={`bn-item${tab==='planning'?' active':''}`} onClick={()=>go('planning')}>
          <span className="bn-icon">📋</span>Planning
        </button>
        <button className={`bn-item${tab==='budget'?' active':''}`} onClick={()=>go('budget')}>
          <span className="bn-icon">💰</span>Budget
        </button>
        <button className="bn-item" onClick={()=>setShowMore(true)}>
          <span className="bn-icon">···</span>Plus
        </button>
      </nav>

      {showMore && (
        <div className="bn-sheet-overlay" onClick={e=>e.target===e.currentTarget&&setShowMore(false)}>
          <div className="bn-sheet">
            <div className="bn-sheet-handle"/>
            {displayUser && (
              <div style={{padding:'.5rem 1.1rem .65rem',borderBottom:'1px solid var(--border)',marginBottom:'.25rem'}}>
                <div style={{fontSize:'.85rem',fontWeight:600}}>{displayUser}</div>
                <div style={{fontSize:'.7rem',color:'var(--text-muted)'}}>Connecté</div>
              </div>
            )}
            <button className="bn-sheet-item" onClick={()=>go('infos')}><span>ℹ️</span>Infos du séjour</button>
            <button className="bn-sheet-item" onClick={()=>go('sac')}><span>🎒</span>Sac à dos</button>
            <button className="bn-sheet-item" onClick={()=>go('ai')}><span>🤖</span>IA Activités</button>
            {onOpenVoyageurs && <button className="bn-sheet-item" onClick={()=>{onOpenVoyageurs();setShowMore(false)}}><span>👥</span>Voyageurs</button>}
            {onOpenGlobalBudget && <button className="bn-sheet-item" onClick={()=>{onOpenGlobalBudget();setShowMore(false)}}><span>🌍</span>Budget global</button>}
            {isAdmin && onOpenAdmin && <button className="bn-sheet-item" style={{color:'var(--amber)'}} onClick={()=>{onOpenAdmin();setShowMore(false)}}><span>⚙️</span>Administration</button>}
            {onSignOut && <button className="bn-sheet-item" style={{color:'var(--red)',borderTop:'1px solid var(--border)',marginTop:'.25rem'}} onClick={()=>{setShowMore(false);onSignOut()}}><span>🚪</span>Déconnexion</button>}
          </div>
        </div>
      )}
    </>
  )
}
