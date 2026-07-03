import { useState } from 'react'
import { generateShareCode } from '../firebase'

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


const EXPIRE_OPTIONS = [
  { label: 'Jamais', value: null },
  { label: '1 heure', value: 3600000 },
  { label: '24 heures', value: 86400000 },
  { label: '7 jours', value: 604800000 },
  { label: '30 jours', value: 2592000000 },
]
const USES_OPTIONS = [
  { label: 'Illimité', value: null },
  { label: '1 personne', value: 1 },
  { label: '3 personnes', value: 3 },
  { label: '5 personnes', value: 5 },
  { label: '10 personnes', value: 10 },
]

function ShareLink({ tripId, tripName, ownerUid }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [maxUses, setMaxUses] = useState(null)
  const [expiresIn, setExpiresIn] = useState(null)
  const [linkInfo, setLinkInfo] = useState(null)

  const generate = async () => {
    setLoading(true)
    try {
      const { generateShareCode } = await import('../firebase')
      const code = await generateShareCode(ownerUid, tripId, tripName, { maxUses, expiresIn })
      const url = window.location.origin + '?share=' + code
      setShareUrl(url)
      setLinkInfo({ maxUses, expiresIn })
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la création du lien')
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setShareUrl(null)
    setLinkInfo(null)
    setShowOptions(false)
  }

  if (!shareUrl) {
    return (
      <div style={{ marginTop: '.5rem' }}>
        {!showOptions ? (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            <button onClick={generate} disabled={loading} className="btn btn-primary">
              {loading ? '⏳ Génération...' : '🔗 Générer un lien'}
            </button>
            <button onClick={() => setShowOptions(true)} className="btn" style={{ fontSize: '.78rem' }}>
              ⚙️ Options
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '.85rem', marginBottom: '.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Expiration</label>
                <select value={expiresIn || ''} onChange={e => setExpiresIn(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.82rem', fontFamily: 'inherit', background: '#fff' }}>
                  {EXPIRE_OPTIONS.map(o => <option key={o.label} value={o.value || ''}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Nb max d'utilisations</label>
                <select value={maxUses || ''} onChange={e => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.82rem', fontFamily: 'inherit', background: '#fff' }}>
                  {USES_OPTIONS.map(o => <option key={o.label} value={o.value || ''}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <button onClick={generate} disabled={loading} className="btn btn-primary">
                {loading ? '⏳...' : '🔗 Générer'}
              </button>
              <button onClick={() => setShowOptions(false)} className="btn">Annuler</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '.5rem' }}>
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
        <input value={shareUrl} readOnly style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.75rem', background: 'var(--bg)', fontFamily: 'monospace' }} onClick={e => e.target.select()} />
        <button onClick={copy} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          {copied ? '✅ Copié !' : '📋 Copier'}
        </button>
        <button onClick={reset} className="btn" title="Générer un nouveau lien" style={{ whiteSpace: 'nowrap' }}>🔄</button>
      </div>
      <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.3rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <span>Partage ce lien avec tes compagnons</span>
        {linkInfo?.maxUses && <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '1px 6px', borderRadius: 10 }}>Max {linkInfo.maxUses} pers.</span>}
        {linkInfo?.expiresIn && <span style={{ background: 'var(--amber-light)', color: 'var(--amber)', padding: '1px 6px', borderRadius: 10 }}>Expire dans {EXPIRE_OPTIONS.find(o => o.value === linkInfo.expiresIn)?.label}</span>}
      </div>
    </div>
  )
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
      {/* Section partage — en premier */}
      <div className="info-card" style={{ borderLeft: '3px solid var(--green)', marginBottom: '1rem' }}>
        <h3>🔗 Inviter des participants</h3>
        <p>Génère un lien de partage pour ce séjour. Toute personne avec le lien pourra voir et participer.</p>
        <ShareLink tripId={trip.id} tripName={trip.name} ownerUid={trip.ownerUid || ''} />
      </div>
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
