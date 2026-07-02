import { useState, useEffect } from 'react'
import { createInviteCode, getAllInviteCodes, getAllUsersWithTrips, deleteInviteCode, adminDeleteTrip } from '../firebase'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtTripDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${d} ${months[m - 1]} ${y}`
}

function TripDetailView({ trip, ownerEmail, onBack, onManage, onDelete }) {
  const totalDays = trip.days?.length || 0
  const totalActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.length || 0), 0) || 0
  const totalDistance = trip.days?.reduce((sum, d) => sum + (d.activities?.reduce((s, a) => s + (a.distanceKm || 0), 0) || 0), 0) || 0
  const totalDplus = trip.days?.reduce((sum, d) => sum + (d.activities?.reduce((s, a) => s + (a.dplus || 0), 0) || 0), 0) || 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '.85rem', marginBottom: '1.25rem', fontFamily: 'inherit' }}>
        ← Retour à la liste
      </button>

      <div style={{ background: trip.color || 'var(--green)', borderRadius: 14, padding: '1.5rem', color: '#fff', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '.78rem', opacity: .85, marginBottom: '.3rem' }}>{ownerEmail || 'Email inconnu'}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '.3rem' }}>{trip.name}</div>
        <div style={{ fontSize: '.85rem', opacity: .9 }}>{trip.destination}</div>
        {trip.startDate && trip.endDate && (
          <div style={{ fontSize: '.82rem', opacity: .85, marginTop: '.4rem' }}>
            {fmtTripDate(trip.startDate)} → {fmtTripDate(trip.endDate)}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '.65rem', marginBottom: '1.25rem' }}>
        {[
          ['📅', totalDays, 'jours'],
          ['🎯', totalActivities, 'activités'],
          ['📍', totalDistance.toFixed(0) + ' km', 'distance'],
          ['⬆️', totalDplus + ' m', 'D+ total'],
          ['👥', trip.voyageurs?.length || 0, 'voyageurs'],
          ['💰', trip.budget ? trip.budget + '€' : '—', 'budget'],
        ].map(([icon, val, label], i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem' }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: '.95rem', marginTop: '.2rem' }}>{val}</div>
            <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {trip.voyageurs?.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Voyageurs & leurs données perso</div>
          {trip.voyageurs.map(v => {
            const vd = trip.voyageurData?.[v.id] || {}
            const valise = vd.valise || []
            const sac = vd.sac || []
            const depenses = vd.depenses || []
            const totalDepenses = depenses.reduce((s, d) => s + (d.amount || 0), 0)
            return (
              <div key={v.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.8rem 1rem', marginBottom: '.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '.4rem' }}>
                  {v.name} {v.email && <span style={{ color: 'var(--text-muted)', fontSize: '.72rem', fontWeight: 400 }}>({v.email})</span>}
                </div>
                <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--text-muted)' }}>
                  <span>🧳 Valise : {valise.filter(i => i.done).length}/{valise.length}</span>
                  <span>🎒 Sac : {sac.filter(i => i.done).length}/{sac.length}</span>
                  <span>💸 Dépenses perso : {totalDepenses.toFixed(2)}€ ({depenses.length} ligne{depenses.length > 1 ? 's' : ''})</span>
                </div>
                {(valise.length > 0 || sac.length > 0) && (
                  <details style={{ marginTop: '.5rem' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '.74rem', color: 'var(--text-muted)' }}>Voir le détail</summary>
                    <div style={{ marginTop: '.4rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {valise.length > 0 && (
                        <div>
                          <div style={{ fontSize: '.7rem', fontWeight: 600, marginBottom: '.2rem' }}>🧳 Valise</div>
                          {valise.map(i => (
                            <div key={i.id} style={{ fontSize: '.72rem', color: i.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: i.done ? 'line-through' : 'none' }}>
                              {i.qty > 1 ? `×${i.qty} ` : ''}{i.text}
                            </div>
                          ))}
                        </div>
                      )}
                      {sac.length > 0 && (
                        <div>
                          <div style={{ fontSize: '.7rem', fontWeight: 600, marginBottom: '.2rem' }}>🎒 Sac à dos</div>
                          {sac.map(i => (
                            <div key={i.id} style={{ fontSize: '.72rem', color: i.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: i.done ? 'line-through' : 'none' }}>
                              {i.qty > 1 ? `×${i.qty} ` : ''}{i.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      )}

      {trip.days?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Programme</div>
          {trip.days.map(d => (
            <div key={d.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, padding: '.65rem .9rem', marginBottom: '.4rem' }}>
              <div style={{ fontWeight: 600, fontSize: '.84rem', marginBottom: d.activities?.length ? '.3rem' : 0 }}>{fmtTripDate(d.date)}</div>
              {d.activities?.map(a => (
                <div key={a.id} style={{ fontSize: '.78rem', color: 'var(--text-muted)', paddingLeft: '.5rem' }}>• {a.title}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '.6rem' }}>
        <button className="btn btn-primary" onClick={onManage} style={{ flex: 1, justifyContent: 'center' }}>
          ✏️ Gérer ce séjour
        </button>
        <button className="btn" onClick={onDelete} style={{ color: 'var(--red)' }}>
          🗑 Supprimer
        </button>
      </div>
    </div>
  )
}

function UsersTree({ users, loading, onSelectTrip }) {
  const [expanded, setExpanded] = useState({})
  const toggle = (uid) => setExpanded(prev => ({ ...prev, [uid]: !prev[uid] }))

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chargement…</div>
  if (users.length === 0) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>Aucun utilisateur trouvé</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {users.map(u => (
        <div key={u.uid} style={{ marginBottom: '.6rem' }}>
          <div onClick={() => toggle(u.uid)} style={{
            display: 'flex', alignItems: 'center', gap: '.65rem', cursor: 'pointer',
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem 1rem'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{expanded[u.uid] ? '📂' : '📁'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '.88rem' }}>
                {u.email || (u.trips[0]?.voyageurs?.[0]?.name ? `${u.trips[0].voyageurs[0].name} (sans email)` : `Utilisateur anonyme · ${u.uid.slice(0, 8)}…`)}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                {u.trips.length} séjour{u.trips.length > 1 ? 's' : ''}
                {u.joinedAt && ` · rejoint le ${fmtDate(u.joinedAt)}`}
                {u.inviteCode && ` · code ${u.inviteCode}`}
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{expanded[u.uid] ? '▴' : '▾'}</span>
          </div>

          {expanded[u.uid] && (
            <div style={{ paddingLeft: '1.5rem', marginTop: '.4rem' }}>
              {u.trips.length === 0 ? (
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', padding: '.5rem 0' }}>Aucun séjour créé</div>
              ) : u.trips.map(trip => (
                <div key={trip.id} onClick={() => onSelectTrip(u, trip)} style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer',
                  background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '.55rem .8rem', marginBottom: '.35rem'
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: trip.color || 'var(--green)', flexShrink: 0 }}></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '.83rem' }}>{trip.name}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                      {trip.destination} {trip.startDate && `· ${fmtTripDate(trip.startDate)}`}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function fmtEUR(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}

function GlobalBudgetView({ users, loading }) {
  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chargement…</div>

  const allTrips = users.flatMap(u => (u.trips || []).map(t => ({ ...t, ownerEmail: u.email, ownerUid: u.uid })))
  const tripStats = allTrips.map(t => {
    const expenses = t.expenses || []
    const perso = Object.values(t.voyageurData || {}).flatMap(vd => vd.depenses || [])
    const total = [...expenses, ...perso].reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    const budget = t.budget || 0
    const pct = budget > 0 ? Math.round(total / budget * 100) : null
    return { trip: t, total, budget, pct }
  })

  const grandTotal = tripStats.reduce((s, t) => s + t.total, 0)
  const grandBudget = tripStats.reduce((s, t) => s + t.budget, 0)
  const grandPct = grandBudget > 0 ? Math.round(grandTotal / grandBudget * 100) : null

  if (allTrips.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>Aucun séjour avec budget trouvé</div>
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.65rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>Budget total prévu</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{grandBudget > 0 ? fmtEUR(grandBudget) : '—'}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>Dépensé (tous séjours)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: grandPct >= 100 ? 'var(--red)' : 'var(--text)' }}>{fmtEUR(grandTotal)}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>Séjours avec budget</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{tripStats.filter(t => t.budget > 0).length} / {allTrips.length}</div>
        </div>
      </div>

      {tripStats.map(({ trip, total, budget, pct }) => (
        <div key={trip.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '.8rem 1rem', marginBottom: '.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: budget > 0 ? '.5rem' : 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: trip.color || 'var(--green)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{trip.name}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{trip.ownerEmail || 'Email inconnu'} · {trip.destination}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{fmtEUR(total)}</div>
              {budget > 0 && <div style={{ fontSize: '.71rem', color: pct >= 100 ? 'var(--red)' : 'var(--text-muted)' }}>{pct}% / {fmtEUR(budget)}</div>}
            </div>
          </div>
          {budget > 0 && (
            <div style={{ height: 6, background: 'var(--gray-light)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? 'var(--red)' : 'var(--green)', borderRadius: 3 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AdminPanel({ uid, adminEmail, onClose, onManageTrip, inline = false }) {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    if (tab === 'users' || tab === 'budget') {
      const data = await getAllUsersWithTrips()
      // Affiche ton propre email même si tu n'as jamais consommé de code (tu es admin)
      const enriched = data.map(u => u.uid === uid ? { ...u, email: u.email || adminEmail } : u)
      setUsers(enriched)
    }
    if (tab === 'codes') setCodes(await getAllInviteCodes())
    setLoading(false)
  }

  const handleCreate = async () => {
    setCreating(true); setNewCode(null)
    const code = await createInviteCode(uid, note)
    if (code) { setNewCode(code); setNote(''); loadData() }
    setCreating(false)
  }

  const handleDeleteCode = async (code) => {
    if (!confirm(`Supprimer le code ${code} ?`)) return
    await deleteInviteCode(code)
    loadData()
  }

  const handleDeleteTrip = async () => {
    if (!selected) return
    if (!confirm(`Supprimer définitivement le séjour "${selected.trip.name}" ? Cette action est irréversible.`)) return
    await adminDeleteTrip(selected.user.uid, selected.trip.id)
    setSelected(null)
    loadData()
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  const totalTrips = users.reduce((sum, u) => sum + u.trips.length, 0)

  return (
    <div style={{ position: inline ? 'relative' : 'fixed', inset: inline ? 'auto' : 0, background: 'var(--bg)', zIndex: inline ? 'auto' : 1000, overflowY: 'auto', minHeight: inline ? 'auto' : '100vh' }}>
      {!inline && (
        <div style={{ background: 'linear-gradient(135deg, #2a1a3e 0%, #1e2540 50%, #0f1f3a 100%)', padding: '1.25rem 1.5rem', color: '#fff' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', fontWeight: 700 }}>⚙️ Administration</div>
              <div style={{ fontSize: '.78rem', opacity: .65, marginTop: '.15rem' }}>
                {users.length} utilisateur{users.length > 1 ? 's' : ''} · {totalTrips} séjour{totalTrips > 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit' }}>
              ✕ Retour à l'app
            </button>
          </div>
        </div>
      )}
      {inline && (
        <div style={{ padding: '1rem 1.5rem .5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>⚙️ Administration</h2>
          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>
            {users.length} utilisateur{users.length > 1 ? 's' : ''} · {totalTrips} séjour{totalTrips > 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div style={{ padding: '1.5rem' }}>
        {!selected ? (
          <>
            <div style={{ maxWidth: 900, margin: '0 auto 1.5rem', display: 'flex', gap: '.4rem', background: 'var(--gray-light)', borderRadius: 10, padding: '3px' }}>
              {[['users', '👥 Utilisateurs & séjours'], ['budget', '💰 Budget global'], ['codes', "🔑 Codes d'invitation"]].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: '.85rem', fontWeight: 500, fontFamily: 'inherit',
                  background: tab === key ? '#fff' : 'transparent',
                  color: tab === key ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                  transition: 'all .15s'
                }}>{label}</button>
              ))}
            </div>

            {tab === 'users' && (
              <UsersTree users={users} loading={loading} onSelectTrip={(user, trip) => setSelected({ user, trip })} />
            )}

            {tab === 'budget' && (
              <GlobalBudgetView users={users} loading={loading} />
            )}

            {tab === 'codes' && (
              <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '.6rem' }}>✨ Créer un code d'invitation</div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (ex: pour Marc, famille Dupont…)"
                      style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: '.83rem', fontFamily: 'inherit', background: '#fff' }}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                    <button className="btn btn-primary" onClick={handleCreate} disabled={creating} style={{ whiteSpace: 'nowrap', fontSize: '.83rem' }}>
                      {creating ? '⏳' : '+ Générer'}
                    </button>
                  </div>
                  {newCode && (
                    <div style={{ marginTop: '.75rem', background: '#fff', border: '2px solid var(--green)', borderRadius: 8, padding: '.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.15rem' }}>Code généré :</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem', color: 'var(--green)', letterSpacing: '.1em' }}>{newCode}</div>
                      </div>
                      <button className="btn btn-primary" onClick={() => handleCopy(newCode)} style={{ fontSize: '.78rem' }}>
                        {copied === newCode ? '✓ Copié !' : '📋 Copier'}
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement…</div>
                ) : codes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>Aucun code créé</div>
                ) : (
                  codes.map(c => (
                    <div key={c.code} style={{
                      border: `1px solid ${c.usedBy ? 'var(--border)' : 'var(--green)'}`, borderRadius: 9,
                      padding: '.7rem .9rem', marginBottom: '.5rem',
                      background: c.usedBy ? 'var(--gray-light)' : 'var(--card)', opacity: c.usedBy ? .7 : 1
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.95rem', letterSpacing: '.06em', color: c.usedBy ? 'var(--text-muted)' : 'var(--green)' }}>{c.code}</span>
                          {c.usedBy ? (
                            <span style={{ fontSize: '.72rem', background: 'var(--gray-light)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', color: 'var(--text-muted)' }}>✓ Utilisé</span>
                          ) : (
                            <span style={{ fontSize: '.72rem', background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 5, padding: '1px 6px', color: 'var(--green)' }}>Disponible</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '.35rem' }}>
                          {!c.usedBy && <button className="btn" onClick={() => handleCopy(c.code)} style={{ fontSize: '.72rem', padding: '3px 8px' }}>{copied === c.code ? '✓' : '📋'}</button>}
                          {!c.usedBy && <button className="btn" onClick={() => handleDeleteCode(c.code)} style={{ fontSize: '.72rem', padding: '3px 8px', color: 'var(--red)' }}>🗑</button>}
                        </div>
                      </div>
                      {c.note && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>📝 {c.note}</div>}
                      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
                        Créé le {fmtDate(c.createdAt)}
                        {c.usedBy && c.usedEmail && ` · Utilisé par ${c.usedEmail} le ${fmtDate(c.usedAt)}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <TripDetailView
            trip={selected.trip}
            ownerEmail={selected.user.email}
            onBack={() => setSelected(null)}
            onManage={() => onManageTrip(selected.user, selected.trip)}
            onDelete={handleDeleteTrip}
          />
        )}
      </div>
    </div>
  )
}
