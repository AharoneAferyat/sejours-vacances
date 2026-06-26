import { useState } from 'react'

function fmt(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}

export default function GlobalBudget({ trips, onClose }) {
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

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <h2>💰 Budget global — tous les séjours</h2>

        {/* Grand total */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.75rem' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>Total tous séjours</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>{fmt(grandTotal)}</div>
          </div>
          <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.75rem' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>Budget total prévu</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>{grandBudget > 0 ? fmt(grandBudget) : '—'}</div>
          </div>
        </div>

        {/* Per trip */}
        {tripStats.map(({ trip, total, budget, pct }) => {
          const barColor = pct === null ? '#1D9E75' : pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75'
          const expenses = trip.expenses || []
          return (
            <div key={trip.id} className="card" style={{ marginBottom: '.65rem', cursor: 'pointer' }}
              onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: trip.color || '#0F6E56', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{trip.name}</div>
                  {trip.startDate && (
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                      {new Date(trip.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                      {' → '}
                      {new Date(trip.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{fmt(total)}</div>
                  {budget > 0 && <div style={{ fontSize: '.72rem', color: pct >= 100 ? 'var(--red)' : 'var(--text-muted)' }}>{pct}% du budget</div>}
                </div>
              </div>

              {budget > 0 && (
                <div style={{ height: 5, background: 'var(--gray-light)', borderRadius: 20, overflow: 'hidden', marginTop: '.6rem' }}>
                  <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: barColor, borderRadius: 20 }} />
                </div>
              )}

              {/* Expanded detail */}
              {selectedTrip === trip.id && expenses.length > 0 && (
                <div style={{ marginTop: '.75rem', borderTop: '1px solid var(--border)', paddingTop: '.65rem' }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
                  </div>
                  {expenses.slice(0, 5).map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.label}</span>
                      <span style={{ fontWeight: 500, flexShrink: 0, marginLeft: '.5rem' }}>{fmt(e.amount)}</span>
                    </div>
                  ))}
                  {expenses.length > 5 && (
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.3rem' }}>
                      + {expenses.length - 5} autres dépenses
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {trips.every(t => !(t.expenses?.length)) && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
            Aucune dépense sur aucun séjour
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
