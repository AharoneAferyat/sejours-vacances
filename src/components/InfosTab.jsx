import { useState } from 'react'

const ICONS = ['📋','🏕','🚄','📞','🗺','🛡','🚌','🍽','💊','🏥','💰','🔑','⚠️','📸','🎒','🌤','🏊','⛷','🦌','🌿','🏔','🌊','🎯','📍','🗓','💡']

function BlockForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { icon: '📋', title: '', content: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="info-card" style={{ border: '2px solid var(--green)' }}>
      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.6rem' }}>
        {ICONS.map(ic => (
          <button key={ic} onClick={() => set('icon', ic)} style={{
            width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: '1rem',
            border: form.icon === ic ? '2px solid var(--green)' : '1px solid var(--border)',
            background: form.icon === ic ? 'var(--green-light)' : 'transparent',
          }}>{ic}</button>
        ))}
      </div>
      <div className="form-group">
        <label>Titre</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: Hébergement, Transport, Urgences…" />
      </div>
      <div className="form-group">
        <label>Contenu</label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)}
          rows={6} placeholder={'• Info 1\n• Info 2\n\n**Texte en gras**\nhttps://lien.com'} />
      </div>
      <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" onClick={() => {
          if (!form.title.trim()) return alert('Titre requis')
          onSave(form)
        }}>✓ Enregistrer</button>
      </div>
    </div>
  )
}

function renderContent(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    const urlMatch = line.match(/https?:\/\/\S+/)
    if (urlMatch && !line.includes('**')) {
      const url = urlMatch[0]
      const label = line.replace(url, '').replace(/^[:\s]+/, '').trim()
      return (
        <div key={i}>
          {label && <span>{label} </span>}
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontWeight: 500 }}>{url} ↗</a>
        </div>
      )
    }
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)
    return <div key={i}>{rendered.some(Boolean) ? rendered : '\u00A0'}</div>
  })
}

export default function InfosTab({ trip, onUpdateTrip }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const blocks = trip?.infoBlocks || []

  const save = (block) => {
    const newBlocks = blocks.map(b => b.id === block.id ? block : b)
    onUpdateTrip({ infoBlocks: newBlocks })
    setEditingId(null)
  }

  const add = (form) => {
    onUpdateTrip({ infoBlocks: [...blocks, { ...form, id: 'info_' + Date.now() }] })
    setAdding(false)
  }

  const del = (id) => {
    onUpdateTrip({ infoBlocks: blocks.filter(b => b.id !== id) })
  }

  if (!trip) return null

  return (
    <div>
      {blocks.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📋</div>
          <div style={{ fontSize: '.85rem' }}>Aucune info pour ce séjour.</div>
          <div style={{ fontSize: '.78rem', marginTop: '.25rem' }}>Ajoute des catégories : hébergement, transport, urgences…</div>
        </div>
      )}

      {blocks.map(block => (
        editingId === block.id
          ? <BlockForm key={block.id} initial={block} onSave={save} onClose={() => setEditingId(null)} />
          : (
            <div key={block.id} className="info-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                <h3>{block.icon} {block.title}</h3>
                <div style={{ display: 'flex', gap: '.2rem' }}>
                  <button className="btn-icon" onClick={() => setEditingId(block.id)}>✏️</button>
                  <button className="btn-icon" onClick={() => confirm(`Supprimer "${block.title}" ?`) && del(block.id)}>🗑</button>
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {renderContent(block.content)}
              </div>
            </div>
          )
      ))}

      {adding
        ? <BlockForm onSave={add} onClose={() => setAdding(false)} />
        : (
          <button className="btn" onClick={() => setAdding(true)}
            style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: '.25rem' }}>
            ＋ Nouvelle catégorie d'infos
          </button>
        )
      }
    </div>
  )
}
