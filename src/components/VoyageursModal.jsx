import { useState } from 'react'

// Password = voyageur_name + trip_name (lowercased, no spaces)
function makePassword(voyageurName, tripName) {
  return (voyageurName + tripName).toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
}

export default function VoyageursModal({ trip, voyageurs, onAdd, onRemove, onClose }) {
  const [tab, setTab] = useState('list') // 'list' | 'invite'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showPass, setShowPass] = useState(null) // voyageur id

  const handleAddWithEmail = () => {
    if (!name.trim()) return alert('Prénom requis')
    onAdd(name.trim(), email.trim() || null)
    setName('')
    setEmail('')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2>👥 Voyageurs — {trip?.name}</h2>

        <div className="tabs" style={{ marginBottom: '.9rem' }}>
          <button className={`tab-btn${tab === 'list' ? ' active' : ''}`} onClick={() => setTab('list')}>
            Participants ({voyageurs.length})
          </button>
          <button className={`tab-btn${tab === 'invite' ? ' active' : ''}`} onClick={() => setTab('invite')}>
            ＋ Ajouter
          </button>
        </div>

        {tab === 'list' && (
          <div>
            {voyageurs.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: i === 0 ? 'var(--green-light)' : 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                    {i === 0 ? '👑' : '👤'}
                  </div>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{v.name}</div>
                    {v.email && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{v.email}</div>}
                    {i === 0 && <div style={{ fontSize: '.68rem', color: 'var(--green)' }}>Organisateur</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                  {i > 0 && (
                    <>
                      <button className="btn" style={{ fontSize: '.7rem', padding: '3px 8px' }}
                        onClick={() => setShowPass(showPass === v.id ? null : v.id)}>
                        🔑 Accès
                      </button>
                      <button className="btn-icon" onClick={() => confirm(`Retirer ${v.name} ?`) && onRemove(v.id)}>✕</button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {showPass && (() => {
              const v = voyageurs.find(x => x.id === showPass)
              if (!v) return null
              const pass = makePassword(v.name, trip?.name || '')
              return (
                <div style={{ background: 'var(--blue-light)', borderRadius: 9, padding: '.75rem', marginTop: '.75rem', fontSize: '.8rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '.4rem', color: 'var(--blue)' }}>🔑 Accès pour {v.name}</div>
                  {v.email ? (
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '.25rem' }}>Via compte Google :</div>
                      <div style={{ fontWeight: 600 }}>{v.email}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '.35rem' }}>Identifiants de connexion :</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                        <span>Nom :</span><strong>{v.name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Code :</span>
                        <strong style={{ fontFamily: 'monospace', letterSpacing: '.05em' }}>{pass}</strong>
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.4rem' }}>
                        Sur le site → "Rejoindre avec un code" → entrer ces identifiants
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'invite' && (
          <div>
            <div style={{ background: 'var(--green-light)', borderRadius: 8, padding: '.65rem .9rem', fontSize: '.78rem', color: 'var(--green)', marginBottom: '.9rem', lineHeight: 1.6 }}>
              💡 Deux options : invite par email Google (la personne se connecte avec son compte), ou crée juste un nom (un code d'accès sera généré automatiquement).
            </div>

            <div className="form-group">
              <label>Prénom *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="ex: Sarah, Papa, Maxime…"
                onKeyDown={e => e.key === 'Enter' && handleAddWithEmail()} />
            </div>

            <div className="form-group">
              <label>Email Google (optionnel)</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="prenom@gmail.com" type="email"
                onKeyDown={e => e.key === 'Enter' && handleAddWithEmail()} />
            </div>

            {name.trim() && !email.trim() && trip?.name && (
              <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: '.55rem .85rem', fontSize: '.76rem', color: 'var(--amber)', marginBottom: '.75rem' }}>
                Code généré : <strong style={{ fontFamily: 'monospace' }}>{makePassword(name.trim(), trip.name)}</strong>
                <div style={{ fontSize: '.7rem', marginTop: '.2rem', opacity: .8 }}>À communiquer à {name.trim()} pour qu'il accède au séjour.</div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleAddWithEmail}>
              ＋ Ajouter {name.trim() ? name.trim() : 'le voyageur'}
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
