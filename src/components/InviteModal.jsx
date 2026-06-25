import { useState } from 'react'

export default function InviteModal({ trip, onClose, onInvite, onRemoveGuest }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const guests = trip.guests || []

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) return alert('Email invalide')
    setSending(true)
    await onInvite(email.trim().toLowerCase())
    setSending(false)
    setSent(true)
    setEmail('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <h2>✉️ Inviter des participants — {trip.name}</h2>
        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Les invités peuvent accéder au séjour, modifier leur valise et sac à dos, et consulter le planning.
          Ils ne voient pas tes autres séjours.
        </p>

        {/* Current guests */}
        {guests.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Participants invités
            </div>
            {guests.map(g => (
              <div key={g.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 500 }}>{g.name || g.email}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{g.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 20,
                    background: g.accepted ? 'var(--green-light)' : 'var(--amber-light)',
                    color: g.accepted ? 'var(--green)' : 'var(--amber)' }}>
                    {g.accepted ? '✓ Accepté' : '⏳ En attente'}
                  </span>
                  <button className="btn-icon" onClick={() => confirm(`Retirer ${g.email} ?`) && onRemoveGuest(g.email)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invite form */}
        <div className="form-group">
          <label>Adresse email de l'invité</label>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="prenom@exemple.com" type="email"
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={handleInvite} disabled={sending}>
              {sending ? '⏳' : sent ? '✓ Envoyé !' : 'Inviter'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--blue-light)', borderRadius: 8, padding: '.65rem .9rem', fontSize: '.78rem', color: 'var(--blue)', marginBottom: '.75rem' }}>
          ℹ️ L'invité devra se connecter avec le compte Google associé à cet email pour accéder au séjour.
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
