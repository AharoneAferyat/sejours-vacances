import { useState } from 'react'
import { validateShareCode, joinTripViaShare } from '../firebase'

export default function JoinTripModal({ shareCode, onJoined, onClose }) {
  const [step, setStep] = useState('loading') // loading | form | joining | done | error
  const [shareData, setShareData] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  // Valider le code au montage
  useState(() => {
    validateShareCode(shareCode).then(data => {
      if (data) {
        setShareData(data)
        setStep('form')
      } else {
        setStep('error')
        setError('Ce lien d\'invitation est invalide ou a expiré.')
      }
    })
  })

  const handleJoin = async () => {
    if (!name.trim()) return alert('Entre ton prénom')
    if (!email.trim() || !email.includes('@')) return alert('Entre une adresse email valide')
    
    setStep('joining')
    const ok = await joinTripViaShare(shareData.ownerUid, shareData.tripId, name.trim(), email.trim())
    if (ok) {
      setStep('done')
      setTimeout(() => onJoined(), 2000)
    } else {
      setStep('error')
      setError('Impossible de rejoindre ce séjour. Réessaye ou contacte l\'organisateur.')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #1a4a2e 0%, #2d7a4f 50%, #0d5e38 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 2000
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2rem', maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)', textAlign: 'center'
      }}>
        {step === 'loading' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🥾</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Vérification du lien...</p>
          </>
        )}

        {step === 'form' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🎉</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '.3rem' }}>
              Tu es invité !
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '1.5rem' }}>
              Rejoins le séjour <strong style={{ color: 'var(--text)' }}>"{shareData.tripName || 'Séjour'}"</strong>
            </p>

            <div style={{ textAlign: 'left', marginBottom: '.75rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Ton prénom *
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="ex: Marc"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '.9rem', fontFamily: 'inherit', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Ton email *
              </label>
              <input
                type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ex: marc@gmail.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '.9rem', fontFamily: 'inherit', background: 'var(--bg)' }}
              />
            </div>

            <button onClick={handleJoin} style={{
              width: '100%', background: 'var(--green)', color: '#fff', border: 'none',
              borderRadius: 12, padding: '.85rem', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(47,143,107,.3)',
            }}>
              Rejoindre le séjour 🚀
            </button>

            <button onClick={onClose} style={{
              marginTop: '.75rem', background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit'
            }}>
              ← Annuler
            </button>
          </>
        )}

        {step === 'joining' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>⏳</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Ajout en cours...</p>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '.3rem' }}>Bienvenue à bord !</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
              Tu as rejoint le séjour. L'organisateur verra ton nom dans la liste des voyageurs.
            </p>
          </>
        )}

        {step === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>😕</div>
            <p style={{ color: 'var(--red)', fontSize: '.9rem', marginBottom: '1rem' }}>{error}</p>
            <button onClick={onClose} className="btn btn-primary">Retour</button>
          </>
        )}
      </div>
    </div>
  )
}
