import { useState } from 'react'
import Budget from './Budget'

function fmt(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}

export default function GlobalBudget({ trips, onClose, isOwner, activeVoyageurId, onUpdateTrip }) {
  const [selectedTrip, setSelectedTrip] = useState(null)

  const tripStats = trips.map(t => {
    const expenses = t.expenses || []
    const total = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    const budget = t.budget || 0
    const pct = budget > 0 ? Math.round(total / budget * 100) : null
    return { trip: t, total, budget, pct }
  })

  const grandTotal = tripStats.reduce((s, t) => s + t.total, 0)
  const grandBudget = tripStats.reduce((s, t) => s + t.budget, 0)

  // If a trip is selected, show its full budget
  if (selectedTrip) {
    const ts = tripStats.find(t => t.trip.id === selectedTrip)
    if (!ts) return null
    const t = ts.trip
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            <button className="btn" style={{ fontSize: '.75rem', padding: '4px 10px' }} onClick={() => setSelectedTrip(null)}>
              ← Retour
            </button>
            <div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Budget détaillé</div>
            </div>
          </div>
          <Budget
            trip={t}
            voyageurs={t.voyageurs || []}
            isGuest={!isOwner}
            activeVoyageurId={activeVoyageurId}
            onUpdate={(changes) => onUpdateTrip && onUpdateTrip(t.id, changes)}
          />
          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2>💰 Budget global</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.75rem .9rem' }}>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>Total dépensé</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{fmt(grandTotal)}</div>
          </div>
          <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.75rem .9rem' }}>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>Budget total prévu</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{grandBudget > 0 ? fmt(grandBudget) : '—'}</div>
          </div>
        </div>

        <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
          Par séjour — cliquez pour le détail
        </div>

        {tripStats.map(({ trip, total, budget, pct }) => {
          const barColor = pct === null ? '#1D9E75' : pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75'
          const today = new Date().toISOString().split('T')[0]
          const isOver = trip.endDate && trip.endDate < today
          const isClosed = trip.closed
          const expenses = trip.expenses || []
          const pendingDebts = (() => {
            if (!trip.voyageurs?.length) return []
            const paid = {}, owes = {}
            trip.voyageurs.forEach(v => { paid[v.id] = 0; owes[v.id] = 0 })
            expenses.filter(e => e.type === 'common').forEach(e => {
              const amount = parseFloat(e.amount) || 0
              const parts = e.participants?.length ? e.participants : trip.voyageurs.map(v => v.id)
              paid[e.payerId] = (paid[e.payerId] || 0) + amount
              parts.forEach(vid => { owes[vid] = (owes[vid] || 0) + amount / parts.length })
            })
            return trip.voyageurs.filter(v => Math.round((owes[v.id] || 0) - (paid[v.id] || 0)) > 0)
          })()

          return (
            <div key={trip.id} style={{ background: 'var(--card)', border: `1px solid ${isClosed ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, marginBottom: '.5rem', overflow: 'hidden' }}>
              {/* Trip row - clickable */}
              <div onClick={() => setSelectedTrip(trip.id)}
                style={{ padding: '.8rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.65rem' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--gray-light)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: trip.color || '#0F6E56', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{trip.name}</div>
                    {isClosed && <span style={{ fontSize: '.65rem', background: 'var(--green-light)', color: 'var(--green)', padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>Clôturé ✓</span>}
                    {isOver && !isClosed && <span style={{ fontSize: '.65rem', background: 'var(--amber-light)', color: 'var(--amber)', padding: '1px 6px', borderRadius: 20, fontWeight: 500 }}>Terminé</span>}
                  </div>
                  {trip.startDate && (
                    <div style={{ fontSize: '.71rem', color: 'var(--text-muted)' }}>
                      {new Date(trip.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                      {' → '}
                      {new Date(trip.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{fmt(total)}</div>
                  {budget > 0 && <div style={{ fontSize: '.71rem', color: pct >= 100 ? 'var(--red)' : 'var(--text-muted)' }}>{pct}% / {fmt(budget)}</div>}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>›</span>
              </div>

              {budget > 0 && (
                <div style={{ height: 4, background: 'var(--gray-light)' }}>
                  <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: barColor }} />
                </div>
              )}

              {/* Close trip CTA — shown when trip is over and not yet closed */}
              {isOver && !isClosed && isOwner && onUpdateTrip && (
                <div style={{ padding: '.65rem 1rem', background: 'var(--amber-light)', borderTop: '1px solid var(--border)' }}>
                  {pendingDebts.length > 0 && (
                    <div style={{ fontSize: '.75rem', color: 'var(--amber)', marginBottom: '.4rem' }}>
                      ⚠️ {pendingDebts.length} remboursement{pendingDebts.length > 1 ? 's' : ''} en attente
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                    <div style={{ fontSize: '.78rem', color: 'var(--amber)', fontWeight: 500 }}>
                      Séjour terminé — clôturer le budget ?
                    </div>
                    <button
                      className="btn"
                      style={{ fontSize: '.72rem', padding: '4px 10px', flexShrink: 0, borderColor: 'var(--amber)', color: 'var(--amber)', fontWeight: 600 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        const hasDebts = pendingDebts.length > 0
                        const msg = hasDebts
                          ? `Clôturer le budget de "${trip.name}" ?

⚠️ Attention : ${pendingDebts.length} remboursement(s) sont encore en attente.

Une fois clôturé, le séjour sera marqué comme terminé.`
                          : `Clôturer le budget de "${trip.name}" ?

✅ Tous les remboursements sont réglés.

Le séjour sera marqué comme terminé.`
                        if (window.confirm(msg)) {
                          onUpdateTrip(trip.id, { closed: true, closedAt: Date.now() })
                        }
                      }}
                    >
                      Clôturer ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
