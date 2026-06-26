import { useState } from 'react'

function makePassword(voyageurName, tripName) {
  return (voyageurName + tripName)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function AddEmailInline({ voyageurId, onAdd }) {
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState('')
  if (!editing) return (
    <button onClick={() => setEditing(true)} style={{ background: 'rgba(15,110,86,.08)', border: '1px dashed rgba(15,110,86,.3)', borderRadius: 7, padding: '4px 10px', color: 'var(--green)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.72rem', fontWeight: 500, width: '100%', textAlign: 'left' }}>
      ＋ Ajouter un email Google
    </button>
  )
  return (
    <div style={{ display: 'flex', gap: '.3rem' }}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@gmail.com" type="email"
        style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', outline: 'none' }}
        onKeyDown={e => e.key === 'Enter' && email && onAdd(email)} autoFocus />
      <button onClick={() => { if (email) onAdd(email); setEditing(false) }} className="btn btn-primary" style={{ fontSize: '.72rem', padding: '5px 10px' }}>OK</button>
      <button onClick={() => setEditing(false)} className="btn" style={{ fontSize: '.72rem', padding: '5px 8px' }}>✕</button>
    </div>
  )
}

function Avatar({ name, size = 44, color = '#0F6E56', index = 0 }) {
  const colors = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D']
  const bg = color || colors[index % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: '#fff', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,.12)'
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function VoyageursModal({ trip, voyageurs, onAdd, onRemove, onUpdateEmail, onClose }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showAccess, setShowAccess] = useState(null)

  const COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D']

  const handleAdd = () => {
    if (!name.trim()) return alert('Prénom requis')
    onAdd(name.trim(), email.trim() || null)
    setName('')
    setEmail('')
    setAdding(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.1rem' }}>
          <h2 style={{ marginBottom: '.2rem' }}>👥 Voyageurs</h2>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{trip?.name} · {voyageurs.length} participant{voyageurs.length > 1 ? 's' : ''}</div>
        </div>

        {/* Avatars row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {voyageurs.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem', cursor: 'pointer' }}
              onClick={() => setShowAccess(showAccess === v.id ? null : v.id)}>
              <div style={{ position: 'relative' }}>
                <Avatar name={v.name} size={52} index={i} />
                {i === 0 && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '.75rem', background: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>👑</div>
                )}
              </div>
              <div style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--text)', textAlign: 'center' }}>{v.name}</div>
              {v.email && <div style={{ fontSize: '.63rem', color: 'var(--text-muted)', maxWidth: 70, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.email.split('@')[0]}</div>}
            </div>
          ))}

          {/* Add button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem', cursor: 'pointer' }}
            onClick={() => setAdding(true)}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--text-muted)' }}>＋</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Ajouter</div>
          </div>
        </div>

        {/* Access info panel */}
        {showAccess && (() => {
          const v = voyageurs.find(x => x.id === showAccess)
          const i = voyageurs.findIndex(x => x.id === showAccess)
          if (!v) return null
          const pass = makePassword(v.name, trip?.name || '')
          return (
            <div style={{ background: 'var(--gray-light)', borderRadius: 10, padding: '.9rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <Avatar name={v.name} size={36} index={i} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{v.name}</div>
                    {i === 0 && <div style={{ fontSize: '.68rem', color: 'var(--green)' }}>Organisateur</div>}
                  </div>
                </div>
                {i > 0 && (
                  <button className="btn btn-danger" style={{ fontSize: '.72rem' }}
                    onClick={() => { confirm(`Retirer ${v.name} ?`) && onRemove(v.id); setShowAccess(null) }}>
                    Retirer
                  </button>
                )}
              </div>

              {i > 0 && (
                <>
                  <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>
                    🔑 Accès au séjour
                  </div>
                  {v.email ? (
                    <div style={{ fontSize: '.82rem' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '.73rem', marginBottom: '.2rem' }}>Connexion Google avec :</div>
                      <div style={{ fontWeight: 600 }}>{v.email}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                        <div style={{ background: '#fff', borderRadius: 7, padding: '.5rem .7rem', fontSize: '.78rem' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', marginBottom: '.1rem' }}>Nom</div>
                          <div style={{ fontWeight: 600 }}>{v.name}</div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: 7, padding: '.5rem .7rem', fontSize: '.78rem' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', marginBottom: '.1rem' }}>Code</div>
                          <div style={{ fontWeight: 600, fontFamily: 'monospace', letterSpacing: '.03em' }}>{pass}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.4rem' }}>
                        Sur le site → "Rejoindre avec un code" → entrer ces identifiants
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })()}

        {/* Add form */}
        {adding && (
          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '.9rem', marginBottom: '.75rem', border: '1px solid rgba(15,110,86,.2)' }}>
            <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '.75rem', color: 'var(--green)' }}>＋ Nouveau voyageur</div>
            <div className="form-group">
              <label>Prénom *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Sarah, Papa…"
                onKeyDown={e => e.key === 'Enter' && handleAdd()} autoFocus />
            </div>
            <div className="form-group">
              <label>Email Google (optionnel)</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom@gmail.com" type="email" />
            </div>
            {name.trim() && !email.trim() && (
              <div style={{ fontSize: '.73rem', color: 'var(--green)', marginBottom: '.5rem' }}>
                Code d'accès : <strong style={{ fontFamily: 'monospace' }}>{makePassword(name.trim(), trip?.name || '')}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <button className="btn" onClick={() => { setAdding(false); setName(''); setEmail('') }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdd}>Ajouter</button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
