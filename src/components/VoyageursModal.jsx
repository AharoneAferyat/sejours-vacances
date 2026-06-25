import { useState } from 'react'

export default function VoyageursModal({ tripName, voyageurs, onAdd, onRemove, onClose }) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2>👥 Voyageurs — {tripName}</h2>
        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Les voyageurs sont propres à ce séjour. Chacun a sa valise et son sac à dos.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          {voyageurs.map((v, i) => (
            <div key={v.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '.55rem 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{i === 0 ? '👤' : '👥'}</span>
                <span style={{ fontSize: '.875rem', fontWeight: 500 }}>{v.name}</span>
                {i === 0 && <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>(organisateur)</span>}
              </div>
              {i !== 0 && (
                <button className="btn btn-danger"
                  onClick={() => confirm(`Supprimer ${v.name} de ce séjour ?`) && onRemove(v.id)}>
                  Retirer
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '.4rem' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Prénom du voyageur"
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', fontSize: '.85rem', fontFamily: 'inherit', background: 'var(--bg)', outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button className="btn btn-primary" onClick={handleAdd}>＋ Ajouter</button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
