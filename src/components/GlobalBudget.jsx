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
          return (
            <div key={trip.id} onClick={() => setSelectedTrip(trip.id)}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.8rem 1rem', marginBottom: '.5rem', cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: budget > 0 ? '.5rem' : 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: trip.color || '#0F6E56', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{trip.name}</div>
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
                <div style={{ height: 5, background: 'var(--gray-light)', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: barColor, borderRadius: 20 }} />
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
