import { useState, useEffect } from 'react'
import { validateShareCode, joinTripViaShare } from '../firebase'

export default function JoinTripModal({ shareCode, joinerUid, joinerName, joinerEmail, onJoined, onClose }) {
  const [step, setStep] = useState('loading')
  const [shareData, setShareData] = useState(null)
  const [error, setError] = useState('')

  // Use Google account info directly
  const name = joinerName || ''
  const email = joinerEmail || ''

  useEffect(() => {
    if (!shareCode) { setStep('error'); setError('Pas de code de partage'); return }
    validateShareCode(shareCode).then(result => {
      if (result && result.valid) { setShareData(result); setStep('confirm') }
      else { setStep('error'); setError(result?.error || 'Ce lien d\'invitation est invalide ou a expiré.') }
    }).catch(() => { setStep('error'); setError('Erreur de vérification du lien.') })
  }, [shareCode])

  const handleJoin = async () => {
    if (!name) return alert('Erreur: nom manquant')
    setStep('joining')
    try {
      const ok = await joinTripViaShare(shareData.ownerUid, shareData.tripId, name, email, shareCode, joinerUid)
      if (ok) { setStep('done'); setTimeout(() => onJoined(), 2000) }
      else { setStep('error'); setError('Impossible de rejoindre ce séjour.') }
    } catch (e) { setStep('error'); setError('Erreur : ' + e.message) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #1a4a2e 0%, #2d7a4f 50%, #0d5e38 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', zIndex: 2000
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2rem',
        maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)', textAlign: 'center'
      }}>
        {step === 'loading' && (<>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🥾</div>
          <p style={{ color: '#888', fontSize: '.9rem' }}>Vérification du lien...</p>
        </>)}

        {step === 'confirm' && (<>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🎉</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '.3rem' }}>
            Tu es invité !
          </h2>
          <p style={{ color: '#888', fontSize: '.85rem', marginBottom: '1rem' }}>
            Rejoins le séjour <strong style={{ color: '#1a1a18' }}>"{shareData.tripName || 'Séjour'}"</strong>
          </p>

          {(shareData.maxUses || shareData.expiresAt) && (
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {shareData.maxUses && <span style={{ fontSize: '.7rem', background: '#eef5ff', color: '#275d9c', padding: '2px 8px', borderRadius: 10 }}>
                {Math.max(0, shareData.maxUses - (shareData.usedCount || 0))} place{shareData.maxUses - (shareData.usedCount || 0) > 1 ? 's' : ''} restante{shareData.maxUses - (shareData.usedCount || 0) > 1 ? 's' : ''}
              </span>}
              {shareData.expiresAt && <span style={{ fontSize: '.7rem', background: '#fff8e6', color: '#8f4e20', padding: '2px 8px', borderRadius: 10 }}>
                Expire le {new Date(shareData.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>}
            </div>
          )}

          {/* Account info from Google */}
          <div style={{ background: '#f5f4f0', borderRadius: 12, padding: '.85rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888', marginBottom: '.4rem' }}>Ton compte Google</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2F8F6B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', fontWeight: 700, flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{name}</div>
                <div style={{ fontSize: '.72rem', color: '#888' }}>{email}</div>
              </div>
            </div>
          </div>

          <button onClick={handleJoin} style={{
            width: '100%', background: '#2F8F6B', color: '#fff', border: 'none',
            borderRadius: 12, padding: '.85rem', fontSize: '1rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(47,143,107,.3)',
          }}>
            Rejoindre le séjour 🚀
          </button>

          <button onClick={onClose} style={{
            marginTop: '.75rem', background: 'none', border: 'none', color: '#888',
            cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit'
          }}>
            ← Annuler
          </button>
        </>)}

        {step === 'joining' && (<>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>⏳</div>
          <p style={{ color: '#888', fontSize: '.9rem' }}>Ajout en cours...</p>
        </>)}

        {step === 'done' && (<>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '.3rem' }}>Bienvenue à bord !</h2>
          <p style={{ color: '#888', fontSize: '.85rem' }}>
            Tu as rejoint le séjour. L'organisateur verra ton nom dans la liste des voyageurs.
          </p>
        </>)}

        {step === 'error' && (<>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>😕</div>
          <p style={{ color: '#c0392b', fontSize: '.9rem', marginBottom: '1rem' }}>{error}</p>
          <button onClick={onClose} style={{
            background: '#2F8F6B', color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 20px', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}>Retour</button>
        </>)}
      </div>
    </div>
  )
}
