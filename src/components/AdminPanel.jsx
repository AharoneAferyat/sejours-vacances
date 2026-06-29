import { useState, useEffect } from 'react'
import { createInviteCode, getAllInviteCodes, getAllUsers, deleteInviteCode } from '../firebase'

export default function AdminPanel({ uid, onClose }) {
  const [tab, setTab] = useState('codes') // 'codes' | 'users'
  const [codes, setCodes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    if (tab === 'codes') setCodes(await getAllInviteCodes())
    if (tab === 'users') setUsers(await getAllUsers())
    setLoading(false)
  }

  const handleCreate = async () => {
    setCreating(true)
    setNewCode(null)
    const code = await createInviteCode(uid, note)
    if (code) {
      setNewCode(code)
      setNote('')
      loadData()
    }
    setCreating(false)
  }

  const handleDelete = async (code) => {
    if (!confirm(`Supprimer le code ${code} ?`)) return
    await deleteInviteCode(code)
    loadData()
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (ts) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 650 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>⚙️ Administration</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: '.8rem' }}>✕ Fermer</button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem', background: 'var(--gray-light)', borderRadius: 10, padding: '3px' }}>
          {[['codes', '🔑 Codes d\'invitation'], ['users', '👥 Utilisateurs']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: '.82rem', fontWeight: 500, fontFamily: 'inherit',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              transition: 'all .15s'
            }}>{label}</button>
          ))}
        </div>

        {/* ── CODES D'INVITATION ── */}
        {tab === 'codes' && (
          <>
            {/* Créer un code */}
            <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '.6rem' }}>✨ Créer un code d'invitation</div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Note (ex: pour Marc, famille Dupont…)"
                  style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: '.83rem', fontFamily: 'inherit', background: '#fff' }}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
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

            {/* Liste des codes */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement…</div>
            ) : codes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>Aucun code créé</div>
            ) : (
              <div style={{ maxHeight: '45vh', overflowY: 'auto' }}>
                {codes.map(c => (
                  <div key={c.code} style={{
                    border: `1px solid ${c.usedBy ? 'var(--border)' : 'var(--green)'}`,
                    borderRadius: 9, padding: '.7rem .9rem', marginBottom: '.5rem',
                    background: c.usedBy ? 'var(--gray-light)' : 'var(--card)',
                    opacity: c.usedBy ? .7 : 1
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
                        {!c.usedBy && (
                          <button className="btn" onClick={() => handleCopy(c.code)} style={{ fontSize: '.72rem', padding: '3px 8px' }}>
                            {copied === c.code ? '✓' : '📋'}
                          </button>
                        )}
                        {!c.usedBy && (
                          <button className="btn" onClick={() => handleDelete(c.code)} style={{ fontSize: '.72rem', padding: '3px 8px', color: 'var(--red)' }}>🗑</button>
                        )}
                      </div>
                    </div>
                    {c.note && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>📝 {c.note}</div>}
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
                      Créé le {formatDate(c.createdAt)}
                      {c.usedBy && c.usedEmail && ` · Utilisé par ${c.usedEmail} le ${formatDate(c.usedAt)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── UTILISATEURS ── */}
        {tab === 'users' && (
          <>
            <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Utilisateurs ayant rejoint via un code d'invitation.
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement…</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>Aucun utilisateur encore</div>
            ) : (
              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {users.map(u => (
                  <div key={u.uid} style={{ border: '1px solid var(--border)', borderRadius: 9, padding: '.7rem .9rem', marginBottom: '.5rem', background: 'var(--card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{u.email}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                          Rejoint le {formatDate(u.joinedAt)} · Code : <span style={{ fontFamily: 'monospace' }}>{u.inviteCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
