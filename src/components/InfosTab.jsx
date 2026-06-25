import { useState } from 'react'

const CATEGORY_ICONS = ['🏕', '🚄', '📞', '🗺', '🛡', '🚌', '🍽', '💊', '🏥', '💰', '📋', '🔑', '⚠️', '📸', '🎒', '🌤', '🏊', '⛷', '🦌', '🌿']

function InfoBlock({ block, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: block.title, content: block.content, icon: block.icon })

  const save = () => {
    onUpdate({ ...block, ...form })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="info-card" style={{ border: '2px solid var(--green)' }}>
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
          {CATEGORY_ICONS.map(ic => (
            <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
              style={{ width: 32, height: 32, borderRadius: 6, border: form.icon === ic ? '2px solid var(--green)' : '1px solid var(--border)', background: form.icon === ic ? 'var(--green-light)' : 'transparent', cursor: 'pointer', fontSize: '1rem' }}>
              {ic}
            </button>
          ))}
        </div>
        <div className="form-group">
          <label>Titre</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="ex: Hébergement, Transport…" />
        </div>
        <div className="form-group">
          <label>Contenu (markdown basique supporté)</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={6} placeholder="• Ligne 1&#10;• Ligne 2&#10;&#10;**Gras** avec **texte**&#10;Lien: https://..." />
        </div>
        <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setEditing(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={save}>✓ Enregistrer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="info-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
        <h3>{block.icon} {block.title}</h3>
        <div style={{ display: 'flex', gap: '.25rem' }}>
          <button className="btn-icon" onClick={() => setEditing(true)}>✏️</button>
          <button className="btn-icon" onClick={() => confirm(`Supprimer "${block.title}" ?`) && onDelete()}>🗑</button>
        </div>
      </div>
      <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {renderContent(block.content)}
      </div>
    </div>
  )
}

function renderContent(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)
    // Check if it's a URL line
    const urlMatch = line.match(/https?:\/\/\S+/)
    if (urlMatch && !line.includes('**')) {
      const url = urlMatch[0]
      const label = line.replace(url, '').replace(/^[:\s]+/, '').trim() || url
      return (
        <div key={i}>
          {label && label !== url && <span>{label} </span>}
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 500 }}>{url} ↗</a>
        </div>
      )
    }
    return <div key={i}>{rendered || '\u00A0'}</div>
  })
}

const DEFAULT_BLOCKS = [
  {
    id: 'info_hebergement', icon: '🏕', title: 'Hébergement',
    content: 'Adresse : \nTél : \nDossier : \n\nPension complète, linge inclus, ménage inclus.'
  },
  {
    id: 'info_urgences', icon: '📞', title: 'Urgences & Contacts',
    content: 'Urgences : 15 ou 112\nPGHM Savoie : +33 4 79 08 30 44\nAssistance 24h/7j : '
  },
  {
    id: 'info_transport', icon: '🚄', title: 'Transport',
    content: 'Aller :\n\nRetour :'
  },
]

export default function InfosTab({ trip, onUpdateTrip }) {
  const [adding, setAdding] = useState(false)
  const [newBlock, setNewBlock] = useState({ title: '', content: '', icon: '📋' })

  const blocks = trip?.infoBlocks || DEFAULT_BLOCKS

  const updateBlock = (id, updated) => {
    const newBlocks = blocks.map(b => b.id === id ? updated : b)
    onUpdateTrip({ infoBlocks: newBlocks })
  }

  const deleteBlock = (id) => {
    onUpdateTrip({ infoBlocks: blocks.filter(b => b.id !== id) })
  }

  const addBlock = () => {
    if (!newBlock.title.trim()) return
    const block = { ...newBlock, id: 'info_' + Date.now() }
    onUpdateTrip({ infoBlocks: [...blocks, block] })
    setNewBlock({ title: '', content: '', icon: '📋' })
    setAdding(false)
  }

  if (!trip) return null

  return (
    <div>
      {blocks.map(block => (
        <InfoBlock key={block.id} block={block}
          onUpdate={(updated) => updateBlock(block.id, updated)}
          onDelete={() => deleteBlock(block.id)}
        />
      ))}

      {adding ? (
        <div className="info-card" style={{ border: '2px solid var(--green)' }}>
          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
            {CATEGORY_ICONS.map(ic => (
              <button key={ic} onClick={() => setNewBlock(f => ({ ...f, icon: ic }))}
                style={{ width: 32, height: 32, borderRadius: 6, border: newBlock.icon === ic ? '2px solid var(--green)' : '1px solid var(--border)', background: newBlock.icon === ic ? 'var(--green-light)' : 'transparent', cursor: 'pointer', fontSize: '1rem' }}>
                {ic}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label>Titre de la catégorie</label>
            <input value={newBlock.title} onChange={e => setNewBlock(f => ({ ...f, title: e.target.value }))}
              placeholder="ex: Hébergement, Transport, Urgences…" />
          </div>
          <div className="form-group">
            <label>Contenu</label>
            <textarea value={newBlock.content} onChange={e => setNewBlock(f => ({ ...f, content: e.target.value }))}
              rows={5} placeholder="• Info 1&#10;• Info 2&#10;https://lien.com" />
          </div>
          <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setAdding(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={addBlock}>＋ Ajouter</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={() => setAdding(true)}
          style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: '.25rem' }}>
          ＋ Nouvelle catégorie d'infos
        </button>
      )}
    </div>
  )
}
