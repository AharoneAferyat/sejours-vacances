import { useState } from 'react'

// ─── UTILS ─────────────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}

function calcBalances(expenses, voyageurs) {
  // For each expense: payer paid amount, split among participants
  const paid = {}   // how much each person paid
  const owes = {}   // how much each person should have paid (their share)
  voyageurs.forEach(v => { paid[v.id] = 0; owes[v.id] = 0 })

  expenses.forEach(exp => {
    if (!exp.payerId || !exp.amount) return
    const amount = parseFloat(exp.amount) || 0
    if (exp.type === 'perso') {
      paid[exp.payerId] = (paid[exp.payerId] || 0) + amount
      owes[exp.payerId] = (owes[exp.payerId] || 0) + amount
    } else {
      // Common: split among participants
      const parts = exp.participants || voyageurs.map(v => v.id)
      const share = amount / (parts.length || 1)
      paid[exp.payerId] = (paid[exp.payerId] || 0) + amount
      parts.forEach(vid => { owes[vid] = (owes[vid] || 0) + share })
    }
  })

  // Calculate net balances
  const balances = {}
  voyageurs.forEach(v => { balances[v.id] = Math.round((paid[v.id] || 0) - (owes[v.id] || 0)) })

  // Simplify debts (who pays whom)
  const debts = []
  const pos = voyageurs.filter(v => balances[v.id] > 0).map(v => ({ id: v.id, name: v.name, bal: balances[v.id] }))
  const neg = voyageurs.filter(v => balances[v.id] < 0).map(v => ({ id: v.id, name: v.name, bal: -balances[v.id] }))

  let i = 0, j = 0
  while (i < pos.length && j < neg.length) {
    const amount = Math.min(pos[i].bal, neg[j].bal)
    if (amount > 0) debts.push({ from: neg[j], to: pos[i], amount })
    pos[i].bal -= amount
    neg[j].bal -= amount
    if (pos[i].bal === 0) i++
    if (neg[j].bal === 0) j++
  }

  return { paid, owes, balances, debts }
}

function calcStats(expenses, voyageurs, budget) {
  const total = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const common = expenses.filter(e => e.type === 'common').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const pct = budget > 0 ? Math.round(total / budget * 100) : 0
  const perPerson = voyageurs.length > 0 ? Math.round(total / voyageurs.length) : 0
  return { total, common, pct, perPerson }
}

const CAT_COLORS = {
  transport: '#378ADD', repas: '#1D9E75', activites: '#BA7517',
  hebergement: '#7F77DD', courses: '#D85A30', autre: '#888780'
}
const CAT_LABELS = {
  transport: 'Transport', repas: 'Repas', activites: 'Activités',
  hebergement: 'Hébergement', courses: 'Courses', autre: 'Autre'
}

// ─── ADD EXPENSE FORM ──────────────────────────────────────────────────────
function AddExpenseForm({ voyageurs, days, onAdd, onClose }) {
  const [form, setForm] = useState({
    label: '', amount: '', category: 'repas', type: 'common',
    payerId: voyageurs[0]?.id || '',
    participants: voyageurs.map(v => v.id),
    dayId: days[0]?.id || '', date: days[0]?.date || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleParticipant = (vid) => {
    const parts = form.participants.includes(vid)
      ? form.participants.filter(p => p !== vid)
      : [...form.participants, vid]
    set('participants', parts)
  }

  const handleSubmit = () => {
    if (!form.label.trim() || !form.amount) return alert('Titre et montant requis')
    onAdd({ ...form, id: 'exp_' + Date.now(), amount: parseFloat(form.amount), createdAt: Date.now() })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2>💰 Nouvelle dépense</h2>

        <div className="form-group">
          <label>Description *</label>
          <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="ex: Déjeuner au refuge, Billets train…" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Montant (€) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Catégorie</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Journée</label>
          <select value={form.dayId} onChange={e => {
            const day = days.find(d => d.id === e.target.value)
            set('dayId', e.target.value)
            set('date', day?.date || '')
          }}>
            {days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Type</label>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {[['common', '👥 Dépense commune'], ['perso', '👤 Dépense perso']].map(([val, lbl]) => (
              <button key={val} onClick={() => set('type', val)} style={{
                flex: 1, padding: '7px', border: `1.5px solid ${form.type === val ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', background: form.type === val ? 'var(--green-light)' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem',
                color: form.type === val ? 'var(--green)' : 'var(--text-muted)', fontWeight: form.type === val ? 600 : 400
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Payé par</label>
          <select value={form.payerId} onChange={e => set('payerId', e.target.value)}>
            {voyageurs.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {form.type === 'common' && (
          <div className="form-group">
            <label>Pour qui</label>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.3rem' }}>
              {voyageurs.map(v => (
                <button key={v.id} onClick={() => toggleParticipant(v.id)} style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: `1.5px solid ${form.participants.includes(v.id) ? 'var(--green)' : 'var(--border)'}`,
                  background: form.participants.includes(v.id) ? 'var(--green)' : 'transparent',
                  color: form.participants.includes(v.id) ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 500
                }}>{v.name}</button>
              ))}
            </div>
            {form.participants.length > 0 && form.amount && (
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.35rem' }}>
                = {fmt(parseFloat(form.amount) / form.participants.length)} / personne
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSubmit}>＋ Ajouter</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN BUDGET COMPONENT ─────────────────────────────────────────────────
export default function Budget({ trip, voyageurs, isGuest, guestVoyageurId, onUpdate }) {
  const [tab, setTab] = useState('vue')
  const [showAdd, setShowAdd] = useState(false)

  const budget = trip.budget || 0
  const expenses = trip.expenses || []
  const days = trip.days || []

  const stats = calcStats(expenses, voyageurs, budget)
  const { paid, owes, balances, debts } = calcBalances(expenses, voyageurs)

  const pctColor = stats.pct >= 100 ? 'var(--text-danger)' : stats.pct >= 80 ? 'var(--text-warning)' : 'var(--text-success)'
  const barColor = stats.pct >= 100 ? '#E24B4A' : stats.pct >= 80 ? '#EF9F27' : '#1D9E75'

  // Group expenses by day
  const byDay = {}
  days.forEach(d => { byDay[d.id] = { label: d.label, expenses: [] } })
  expenses.forEach(e => {
    if (byDay[e.dayId]) byDay[e.dayId].expenses.push(e)
    else { if (!byDay['other']) byDay['other'] = { label: 'Sans journée', expenses: [] }; byDay['other'].expenses.push(e) }
  })

  // Category breakdown
  const byCat = {}
  expenses.forEach(e => {
    byCat[e.category] = (byCat[e.category] || 0) + (parseFloat(e.amount) || 0)
  })

  const handleAdd = (expense) => {
    const newExpenses = [...expenses, expense]
    onUpdate({ expenses: newExpenses })
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette dépense ?')) return
    onUpdate({ expenses: expenses.filter(e => e.id !== id) })
  }

  const handleSetBudget = (val) => {
    onUpdate({ budget: parseFloat(val) || 0 })
  }

  const handleSettle = (debt) => {
    // Add a settlement expense
    const settle = {
      id: 'exp_settle_' + Date.now(), label: `Remboursement de ${debt.from.name} à ${debt.to.name}`,
      amount: debt.amount, category: 'autre', type: 'perso',
      payerId: debt.from.id, participants: [debt.to.id],
      dayId: '', date: '', settled: true, createdAt: Date.now()
    }
    onUpdate({ expenses: [...expenses, settle] })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Budget séjour
        </div>
        {!isGuest && (
          <button className="btn btn-primary" style={{ fontSize: '.75rem' }} onClick={() => setShowAdd(true)}>
            ＋ Dépense
          </button>
        )}
      </div>

      {/* Budget setting */}
      {!isGuest && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.5rem .75rem' }}>
          <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Budget prévu :</span>
          <input
            type="number" defaultValue={budget || ''}
            onBlur={e => handleSetBudget(e.target.value)}
            placeholder="ex: 800"
            style={{ width: 90, border: '1px solid var(--border)', borderRadius: 7, padding: '4px 8px', fontSize: '.85rem', fontFamily: 'inherit', background: '#fff', outline: 'none' }}
          />
          <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>€</span>
          {budget > 0 && stats.total > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: pctColor, fontWeight: 600 }}>
              {stats.pct}% utilisé
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {budget > 0 && (
        <div style={{ marginBottom: '.85rem' }}>
          <div style={{ height: 8, background: 'var(--gray-light)', borderRadius: 20, overflow: 'hidden', marginBottom: '.3rem' }}>
            <div style={{ height: '100%', width: Math.min(stats.pct, 100) + '%', background: barColor, borderRadius: 20, transition: 'width .4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text-muted)' }}>
            <span>{fmt(stats.total)} dépensé</span>
            <span style={{ color: pctColor }}>{fmt(budget - stats.total)} restant</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '.75rem' }}>
        {[['vue', '📊 Vue'], ['depenses', '📋 Dépenses'], ['remb', '🔄 Remb.'], ['stats', '📈 Stats']].map(([id, lbl]) => (
          <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* ── VUE GLOBALE ── */}
      {tab === 'vue' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            {[
              ['Total dépensé', fmt(stats.total), pctColor],
              ['Par personne', fmt(stats.perPerson), 'var(--text)'],
              ['Dépenses communes', fmt(stats.common), 'var(--blue)'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.65rem .75rem' }}>
                <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Cat breakdown */}
          {Object.keys(byCat).length > 0 && (
            <div className="card" style={{ padding: '.85rem', marginBottom: '.65rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: '.6rem' }}>Par catégorie</div>
              <div style={{ display: 'flex', height: 10, borderRadius: 20, overflow: 'hidden', gap: 2, marginBottom: '.65rem' }}>
                {Object.entries(byCat).map(([cat, amt]) => (
                  <div key={cat} style={{ flex: amt, background: CAT_COLORS[cat] || '#888' }} />
                ))}
              </div>
              {Object.entries(byCat).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: '.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat] || '#888', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{CAT_LABELS[cat] || cat}</span>
                  </div>
                  <span style={{ fontWeight: 500 }}>{fmt(amt)}</span>
                </div>
              ))}
            </div>
          )}

          {expenses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
              💰 Aucune dépense pour l'instant
            </div>
          )}
        </div>
      )}

      {/* ── DÉPENSES ── */}
      {tab === 'depenses' && (
        <div>
          {Object.entries(byDay).map(([dayId, { label, expenses: dayExps }]) => (
            dayExps.length > 0 && (
              <div key={dayId}>
                <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: '.4rem', marginTop: '.5rem' }}>{label}</div>
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '.5rem' }}>
                  {dayExps.map((exp, i) => {
                    const payer = voyageurs.find(v => v.id === exp.payerId)
                    const parts = exp.participants?.map(pid => voyageurs.find(v => v.id === pid)?.name).filter(Boolean).join(', ')
                    return (
                      <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.65rem .85rem', borderBottom: i < dayExps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[exp.category] || '#888', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.label}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                            {payer?.name || '?'} · {exp.type === 'common' ? `pour ${parts || 'tous'}` : 'perso'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '.7rem', padding: '2px 7px', borderRadius: 20, background: exp.type === 'common' ? 'var(--blue-light)' : 'var(--gray-light)', color: exp.type === 'common' ? 'var(--blue)' : 'var(--text-muted)', fontWeight: 500 }}>
                            {exp.type === 'common' ? 'Commun' : 'Perso'}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{fmt(exp.amount)}</span>
                          {!isGuest && <button className="btn-icon" onClick={() => handleDelete(exp.id)}>🗑</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          ))}
          {expenses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>Aucune dépense</div>
          )}
          {!isGuest && (
            <button className="btn" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: '.5rem' }} onClick={() => setShowAdd(true)}>
              ＋ Ajouter une dépense
            </button>
          )}
        </div>
      )}

      {/* ── REMBOURSEMENTS ── */}
      {tab === 'remb' && (
        <div>
          {debts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
              ✅ Tout le monde est quitte !
            </div>
          ) : (
            <div className="card" style={{ marginBottom: '.65rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: '.6rem' }}>
                Qui rembourse qui
              </div>
              {debts.map((debt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 0', borderBottom: i < debts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                    {debt.from.name.charAt(0)}
                  </div>
                  <div style={{ fontSize: '.82rem', flex: 1 }}>
                    <strong>{debt.from.name}</strong> → <strong>{debt.to.name}</strong>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--red)', fontSize: '.9rem' }}>{fmt(debt.amount)}</span>
                  {!isGuest && (
                    <button className="btn" style={{ fontSize: '.72rem', padding: '3px 9px' }} onClick={() => handleSettle(debt)}>
                      Réglé ✓
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: '.6rem' }}>
              Bilan par personne
            </div>
            {voyageurs.map(v => {
              const bal = balances[v.id] || 0
              const color = bal > 0 ? 'var(--green)' : bal < 0 ? 'var(--red)' : 'var(--text-muted)'
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700 }}>
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                        payé {fmt(paid[v.id] || 0)} · dû {fmt(owes[v.id] || 0)}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color, fontSize: '.9rem' }}>
                    {bal > 0 ? '+' : ''}{fmt(bal)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {tab === 'stats' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            {[
              ['💰 Total', fmt(stats.total)],
              ['👤 Par personne', fmt(stats.perPerson)],
              ['👥 Part commune', Math.round(stats.common / (stats.total || 1) * 100) + '%'],
              ['📅 Par jour', fmt(Math.round(stats.total / (days.length || 1)))],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.65rem .75rem' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>{label}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Spending by day */}
          <div className="card" style={{ marginBottom: '.65rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: '.75rem' }}>Par journée</div>
            {days.map(d => {
              const dayTotal = (byDay[d.id]?.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
              const maxDay = Math.max(...days.map(dd => (byDay[dd.id]?.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)), 1)
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem', fontSize: '.78rem' }}>
                  <span style={{ width: 65, color: 'var(--text-muted)', flexShrink: 0, fontSize: '.72rem' }}>{d.label.split(' ').slice(0, 2).join(' ')}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--gray-light)', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (dayTotal / maxDay * 100) + '%', background: 'var(--green-mid)', borderRadius: 20 }} />
                  </div>
                  <span style={{ width: 52, textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>{dayTotal > 0 ? fmt(dayTotal) : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <AddExpenseForm
          voyageurs={voyageurs}
          days={days}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
