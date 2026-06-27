import { useState } from 'react'

function fmt(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}

function calcBalances(expenses, voyageurs) {
  const paid = {}, owes = {}
  voyageurs.forEach(v => { paid[v.id] = 0; owes[v.id] = 0 })

  expenses.filter(e => e.type === 'common').forEach(exp => {
    const amount = parseFloat(exp.amount) || 0
    const parts = exp.participants?.length ? exp.participants : voyageurs.map(v => v.id)
    const share = amount / parts.length
    paid[exp.payerId] = (paid[exp.payerId] || 0) + amount
    parts.forEach(vid => { owes[vid] = (owes[vid] || 0) + share })
  })

  const balances = {}
  voyageurs.forEach(v => { balances[v.id] = Math.round(((paid[v.id] || 0) - (owes[v.id] || 0)) * 100) / 100 })

  const debts = []
  const pos = voyageurs.filter(v => balances[v.id] > 0.5).map(v => ({ ...v, bal: balances[v.id] }))
  const neg = voyageurs.filter(v => balances[v.id] < -0.5).map(v => ({ ...v, bal: -balances[v.id] }))
  let i = 0, j = 0
  while (i < pos.length && j < neg.length) {
    const amount = Math.round(Math.min(pos[i].bal, neg[j].bal))
    if (amount > 0) debts.push({ from: neg[j], to: pos[i], amount })
    pos[i].bal -= amount; neg[j].bal -= amount
    if (pos[i].bal < 0.5) i++
    if (neg[j].bal < 0.5) j++
  }

  return { paid, owes, balances, debts }
}

const CAT_COLORS = { transport:'#378ADD', repas:'#1D9E75', activites:'#BA7517', hebergement:'#7F77DD', courses:'#D85A30', autre:'#888780' }
const CAT_LABELS = { transport:'Transport', repas:'Repas', activites:'Activités', hebergement:'Hébergement', courses:'Courses', autre:'Autre' }

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', marginBottom: '.5rem', marginTop: '.75rem' }}>
      {children}
    </div>
  )
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.7rem .85rem' }}>
      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

function AddExpenseForm({ voyageurs, days, onAdd, onClose, currentVoyageurId }) {
  const [form, setForm] = useState({
    label: '', amount: '', category: 'repas', type: 'common',
    payerId: currentVoyageurId || voyageurs[0]?.id || '',
    participants: voyageurs.map(v => v.id),
    dayId: days[0]?.id || '', date: days[0]?.date || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleParticipant = (vid) => {
    const parts = form.participants.includes(vid)
      ? form.participants.filter(p => p !== vid)
      : [...form.participants, vid]
    if (parts.length > 0) set('participants', parts)
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
          <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="ex: Déjeuner au refuge…" autoFocus />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Montant (€) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
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
            set('dayId', e.target.value); set('date', day?.date || '')
          }}>
            <option value="">Sans journée</option>
            {days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Type de dépense</label>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {[['common', '👥 Commune', 'Partagée entre voyageurs, entre dans le Tricount'], ['perso', '👤 Perso', 'Visible uniquement par toi, hors Tricount']].map(([val, lbl, desc]) => (
              <button key={val} onClick={() => set('type', val)} style={{
                flex: 1, padding: '8px', border: `1.5px solid ${form.type === val ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', background: form.type === val ? 'var(--green-light)' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left'
              }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: form.type === val ? 'var(--green)' : 'var(--text)' }}>{lbl}</div>
                <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {form.type === 'common' && (
          <>
            <div className="form-group">
              <label>Payé par</label>
              <select value={form.payerId} onChange={e => set('payerId', e.target.value)}>
                {voyageurs.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
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
          </>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSubmit}>＋ Ajouter</button>
        </div>
      </div>
    </div>
  )
}

export default function Budget({ trip, voyageurs, isGuest, activeVoyageurId, onUpdate }) {
  const [tab, setTab] = useState('vue')
  const [showAdd, setShowAdd] = useState(false)

  const budget = trip.budget || 0
  // Common expenses — visible to everyone
  const commonExpenses = trip.expenses || []
  // Personal expenses — only current voyageur's own
  const myVoyageurData = trip.voyageurData?.[activeVoyageurId] || {}
  const myPersonalExpenses = myVoyageurData.depenses || []
  // All expenses visible to current user
  const allMyExpenses = [...commonExpenses, ...myPersonalExpenses]

  const days = trip.days || []

  const totalCommon = commonExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalPerso = myPersonalExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalAll = totalCommon + totalPerso
  const pct = budget > 0 ? Math.round(totalAll / budget * 100) : 0
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75'
  const pctColor = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--green)'

  const { paid, owes, balances, debts } = calcBalances(commonExpenses, voyageurs)

  // By category (common only for shared view)
  const byCat = {}
  commonExpenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + (parseFloat(e.amount) || 0) })

  // By day
  const byDayCommon = {}
  days.forEach(d => { byDayCommon[d.id] = { label: d.label, expenses: [] } })
  commonExpenses.forEach(e => {
    if (byDayCommon[e.dayId]) byDayCommon[e.dayId].expenses.push(e)
    else { if (!byDayCommon['_other']) byDayCommon['_other'] = { label: 'Sans journée', expenses: [] }; byDayCommon['_other'].expenses.push(e) }
  })

  const handleAdd = (expense) => {
    if (expense.type === 'common') {
      onUpdate({ expenses: [...commonExpenses, expense] })
    } else {
      // Store personal expense in voyageurData
      const vd = trip.voyageurData || {}
      const myVd = vd[activeVoyageurId] || {}
      const newDepenses = [...(myVd.depenses || []), expense]
      onUpdate({ voyageurData: { ...vd, [activeVoyageurId]: { ...myVd, depenses: newDepenses } } })
    }
  }

  const handleDeleteCommon = (id) => {
    if (!confirm('Supprimer cette dépense ?')) return
    onUpdate({ expenses: commonExpenses.filter(e => e.id !== id) })
  }

  const handleDeletePerso = (id) => {
    if (!confirm('Supprimer cette dépense ?')) return
    const vd = trip.voyageurData || {}
    const myVd = vd[activeVoyageurId] || {}
    onUpdate({ voyageurData: { ...vd, [activeVoyageurId]: { ...myVd, depenses: (myVd.depenses || []).filter(e => e.id !== id) } } })
  }

  const handleSettle = (debt) => {
    const settle = {
      id: 'exp_settle_' + Date.now(),
      label: `Remboursement ${debt.from.name} → ${debt.to.name}`,
      amount: debt.amount, category: 'autre', type: 'common',
      payerId: debt.from.id, participants: [debt.to.id],
      dayId: '', date: '', settled: true, createdAt: Date.now()
    }
    onUpdate({ expenses: [...commonExpenses, settle] })
  }

  const ExpenseRow = ({ exp, onDelete }) => {
    const payer = voyageurs.find(v => v.id === exp.payerId)
    const parts = exp.participants?.map(pid => voyageurs.find(v => v.id === pid)?.name).filter(Boolean).join(', ')
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem .9rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[exp.category] || '#888', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.84rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.label}</div>
          <div style={{ fontSize: '.71rem', color: 'var(--text-muted)' }}>
            {exp.type === 'common' ? `${payer?.name || '?'} · pour ${parts || 'tous'}` : 'Dépense personnelle'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexShrink: 0 }}>
          <span style={{ fontSize: '.68rem', padding: '2px 7px', borderRadius: 20, background: exp.type === 'common' ? 'var(--blue-light)' : 'var(--gray-light)', color: exp.type === 'common' ? 'var(--blue)' : 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {exp.type === 'common' ? 'Commun' : 'Perso'}
          </span>
          <span style={{ fontWeight: 600, fontSize: '.88rem', whiteSpace: 'nowrap' }}>{fmt(exp.amount)}</span>
          {onDelete && <button className="btn-icon" onClick={onDelete} style={{ flexShrink: 0 }}>🗑</button>}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Budget input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.65rem', background: 'var(--gray-light)', borderRadius: 'var(--radius)', padding: '.55rem .85rem' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>Budget prévu :</span>
        <input type="number" defaultValue={budget || ''} onBlur={e => onUpdate({ budget: parseFloat(e.target.value) || 0 })}
          placeholder="ex: 800" disabled={isGuest}
          style={{ width: 80, border: '1px solid var(--border)', borderRadius: 7, padding: '4px 8px', fontSize: '.85rem', fontFamily: 'inherit', background: '#fff', outline: 'none' }} />
        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>€</span>
        {budget > 0 && <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: pctColor, fontWeight: 600 }}>{pct}% utilisé</span>}
        {!isGuest && (
          <button className="btn btn-primary" style={{ fontSize: '.75rem', flexShrink: 0, marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>
            ＋ Dépense
          </button>
        )}
      </div>

      {/* Progress bar */}
      {budget > 0 && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ height: 7, background: 'var(--gray-light)', borderRadius: 20, overflow: 'hidden', marginBottom: '.3rem' }}>
            <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: barColor, borderRadius: 20, transition: 'width .4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text-muted)' }}>
            <span>{fmt(totalAll)} dépensé</span>
            <span style={{ color: pctColor }}>{fmt(budget - totalAll)} restant</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '.75rem' }}>
        {[['vue','📊 Vue'],['depenses','📋 Dépenses'],['remb','🔄 Remb.'],['stats','📈 Stats']].map(([id,lbl]) => (
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* ── VUE ── */}
      {tab === 'vue' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            <MetricCard label="Dépenses communes" value={fmt(totalCommon)} color="var(--blue)" />
            <MetricCard label="Mes dépenses perso" value={fmt(totalPerso)} />
            <MetricCard label="Mon total" value={fmt(totalAll)} color={pctColor} />
            <MetricCard label="Par personne (commun)" value={voyageurs.length > 0 ? fmt(Math.round(totalCommon / voyageurs.length)) : '—'} />
          </div>

          {Object.keys(byCat).length > 0 && (
            <div className="card" style={{ marginBottom: '.65rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', marginBottom: '.6rem' }}>Répartition par catégorie</div>
              <div style={{ display: 'flex', height: 10, borderRadius: 20, overflow: 'hidden', gap: 2, marginBottom: '.65rem' }}>
                {Object.entries(byCat).map(([cat, amt]) => <div key={cat} style={{ flex: amt, background: CAT_COLORS[cat] || '#888' }} />)}
              </div>
              {Object.entries(byCat).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: '.8rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat] || '#888', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{CAT_LABELS[cat] || cat}</span>
                  </div>
                  <span style={{ fontWeight: 500 }}>{fmt(amt)}</span>
                </div>
              ))}
            </div>
          )}

          {totalAll === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
              💰 Aucune dépense pour l'instant
            </div>
          )}
        </div>
      )}

      {/* ── DÉPENSES ── */}
      {tab === 'depenses' && (
        <div>
          {/* Common expenses by day */}
          {commonExpenses.length > 0 && (
            <>
              <SectionTitle>Dépenses communes</SectionTitle>
              {Object.entries(byDayCommon).map(([dayId, { label, expenses: dayExps }]) =>
                dayExps.length > 0 && (
                  <div key={dayId} style={{ marginBottom: '.65rem' }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.3rem', paddingLeft: '.2rem' }}>{label}</div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {dayExps.map(exp => (
                        <ExpenseRow key={exp.id} exp={exp} onDelete={!isGuest ? () => handleDeleteCommon(exp.id) : null} />
                      ))}
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {/* Personal expenses */}
          {myPersonalExpenses.length > 0 && (
            <>
              <SectionTitle>Mes dépenses perso (visible uniquement par moi)</SectionTitle>
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '.65rem' }}>
                {myPersonalExpenses.map(exp => (
                  <ExpenseRow key={exp.id} exp={exp} onDelete={() => handleDeletePerso(exp.id)} />
                ))}
              </div>
            </>
          )}

          {totalAll === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>Aucune dépense</div>
          )}

          <button className="btn" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: '.5rem' }} onClick={() => setShowAdd(true)}>
            ＋ Ajouter une dépense
          </button>
        </div>
      )}

      {/* ── REMBOURSEMENTS ── */}
      {tab === 'remb' && (
        <div>
          {debts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--green)', fontSize: '.9rem', fontWeight: 500 }}>
              ✅ Tout le monde est quitte !
            </div>
          ) : (
            <>
              <SectionTitle>Qui rembourse qui</SectionTitle>
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '.75rem' }}>
                {debts.map((debt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.7rem .9rem', borderBottom: i < debts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {debt.from.name.charAt(0)}
                    </div>
                    <div style={{ fontSize: '.82rem', flex: 1 }}>
                      <strong>{debt.from.name}</strong> → <strong>{debt.to.name}</strong>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--red)', fontSize: '.9rem', flexShrink: 0 }}>{fmt(debt.amount)}</span>
                    {!isGuest && (
                      <button className="btn" style={{ fontSize: '.72rem', padding: '3px 9px', flexShrink: 0 }} onClick={() => handleSettle(debt)}>
                        Réglé ✓
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionTitle>Bilan par personne</SectionTitle>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {voyageurs.map((v, idx) => {
              const bal = balances[v.id] || 0
              const color = bal > 0.5 ? 'var(--green)' : bal < -0.5 ? 'var(--red)' : 'var(--text-muted)'
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', padding: '.65rem .9rem', borderBottom: idx < voyageurs.length - 1 ? '1px solid var(--border)' : 'none', gap: '.55rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, flexShrink: 0 }}>
                    {v.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.84rem', fontWeight: 500 }}>{v.name}</div>
                    <div style={{ fontSize: '.71rem', color: 'var(--text-muted)' }}>
                      payé {fmt(paid[v.id] || 0)} · doit payer {fmt(owes[v.id] || 0)}
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color, fontSize: '.9rem', flexShrink: 0 }}>
                    {bal > 0.5 ? '+' : ''}{fmt(bal)}
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
            <MetricCard label="Total commun" value={fmt(totalCommon)} color="var(--blue)" />
            <MetricCard label="Mes dépenses perso" value={fmt(totalPerso)} />
            <MetricCard label="Par personne" value={fmt(Math.round(totalCommon / (voyageurs.length || 1)))} />
            <MetricCard label="Par jour" value={fmt(Math.round(totalCommon / (days.length || 1)))} />
          </div>

          <SectionTitle>Dépenses communes par journée</SectionTitle>
          <div className="card" style={{ padding: '.85rem' }}>
            {days.map(d => {
              const dayTotal = (byDayCommon[d.id]?.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
              const maxDay = Math.max(...days.map(dd => (byDayCommon[dd.id]?.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)), 1)
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.45rem', fontSize: '.78rem' }}>
                  <span style={{ width: 68, color: 'var(--text-muted)', flexShrink: 0, fontSize: '.71rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ flex: 1, height: 7, background: 'var(--gray-light)', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (dayTotal / maxDay * 100) + '%', background: 'var(--green-mid)', borderRadius: 20 }} />
                  </div>
                  <span style={{ width: 50, textAlign: 'right', fontWeight: 500, flexShrink: 0, fontSize: '.78rem' }}>{dayTotal > 0 ? fmt(dayTotal) : '—'}</span>
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
          currentVoyageurId={activeVoyageurId}
        />
      )}
    </div>
  )
}
