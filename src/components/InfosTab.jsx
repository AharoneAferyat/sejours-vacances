import { useState } from 'react'
import { generateShareCode, getShareLinksForTrip, deleteShareLink } from '../firebase'

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


function InviteManager({ tripId, tripName, ownerUid }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(null)
  const [maxUses, setMaxUses] = useState(null)
  const [expiresIn, setExpiresIn] = useState(null)
  const [newUrl, setNewUrl] = useState(null)

  const EXPIRE_OPTS = [
    { label: 'Jamais', value: null },
    { label: '1 heure', value: 3600000 },
    { label: '24 heures', value: 86400000 },
    { label: '7 jours', value: 604800000 },
    { label: '30 jours', value: 2592000000 },
  ]
  const USES_OPTS = [
    { label: 'Illimité', value: null },
    { label: '1', value: 1 },
    { label: '3', value: 3 },
    { label: '5', value: 5 },
    { label: '10', value: 10 },
  ]

  const loadLinks = async () => {
    setLoading(true)
    const data = await getShareLinksForTrip(tripId)
    setLinks(data)
    setLoading(false)
  }

  useState(() => { loadLinks() })

  const generate = async () => {
    setCreating(true)
    try {
      const code = await generateShareCode(ownerUid, tripId, tripName, { maxUses, expiresIn })
      const url = window.location.origin + '?share=' + code
      setNewUrl(url)
      loadLinks()
    } catch { alert('Erreur') }
    setCreating(false)
  }

  const handleDelete = async (code) => {
    if (!confirm('Supprimer ce lien d\'invitation ?')) return
    await deleteShareLink(code)
    loadLinks()
  }

  const copy = (url, code) => {
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const isExpired = (link) => link.expiresAt && Date.now() > link.expiresAt
  const isMaxed = (link) => link.maxUses && (link.usedCount || 0) >= link.maxUses

  return (
    <div>
      {/* Créer un nouveau lien */}
      {!showCreate && !newUrl && (
        <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ marginBottom: '.75rem' }}>
          🔗 Créer un lien d'invitation
        </button>
      )}

      {showCreate && !newUrl && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '.85rem', marginBottom: '.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.6rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.2rem', textTransform: 'uppercase' }}>Expiration</label>
              <select value={expiresIn || ''} onChange={e => setExpiresIn(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.82rem', fontFamily: 'inherit' }}>
                {EXPIRE_OPTS.map(o => <option key={o.label} value={o.value || ''}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.2rem', textTransform: 'uppercase' }}>Max personnes</label>
              <select value={maxUses || ''} onChange={e => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.82rem', fontFamily: 'inherit' }}>
                {USES_OPTS.map(o => <option key={o.label} value={o.value || ''}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <button onClick={generate} disabled={creating} className="btn btn-primary">{creating ? '⏳...' : '🔗 Générer'}</button>
            <button onClick={() => setShowCreate(false)} className="btn">Annuler</button>
          </div>
        </div>
      )}

      {newUrl && (
        <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 12, padding: '.85rem', marginBottom: '.75rem' }}>
          <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--green)', marginBottom: '.35rem' }}>✅ Lien créé !</div>
          <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
            <input value={newUrl} readOnly style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.72rem', fontFamily: 'monospace', background: '#fff' }} onClick={e => e.target.select()} />
            <button onClick={() => copy(newUrl, 'new')} className="btn btn-primary">{copied === 'new' ? '✅' : '📋'}</button>
          </div>
          <button onClick={() => { setNewUrl(null); setShowCreate(false) }} style={{ marginTop: '.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', color: 'var(--text-muted)', fontFamily: 'inherit' }}>Fermer</button>
        </div>
      )}

      {/* Liste des invitations actives */}
      {loading ? (
        <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', padding: '.5rem 0' }}>Chargement…</div>
      ) : links.length === 0 ? (
        <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', padding: '.5rem 0' }}>Aucune invitation créée pour ce séjour</div>
      ) : (
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.4rem' }}>
            Invitations ({links.length})
          </div>
          {links.map(link => {
            const url = window.location.origin + '?share=' + link.code
            const expired = isExpired(link)
            const maxed = isMaxed(link)
            const inactive = expired || maxed
            return (
              <div key={link.code} style={{
                background: inactive ? '#f9f8f5' : 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '.65rem .8rem', marginBottom: '.35rem',
                opacity: inactive ? .65 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                  <code style={{ fontSize: '.72rem', color: 'var(--text-muted)', flex: 1 }}>{link.code}</code>
                  <div style={{ display: 'flex', gap: '.25rem' }}>
                    {!inactive && <button onClick={() => copy(url, link.code)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', cursor: 'pointer', fontSize: '.7rem' }}>
                      {copied === link.code ? '✅' : '📋'}
                    </button>}
                    <button onClick={() => handleDelete(link.code)} style={{ background: 'none', border: '1px solid var(--red)', borderRadius: 6, padding: '2px 7px', cursor: 'pointer', fontSize: '.7rem', color: 'var(--red)' }}>🗑</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', fontSize: '.68rem' }}>
                  {/* Statut */}
                  {expired && <span style={{ background: '#fdecea', color: 'var(--red)', padding: '1px 6px', borderRadius: 8 }}>Expiré</span>}
                  {maxed && <span style={{ background: '#fdecea', color: 'var(--red)', padding: '1px 6px', borderRadius: 8 }}>Complet</span>}
                  {!inactive && <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '1px 6px', borderRadius: 8 }}>Actif</span>}
                  {/* Utilisations */}
                  <span style={{ color: 'var(--text-muted)' }}>
                    👥 {link.usedCount || 0}{link.maxUses ? ` / ${link.maxUses}` : ''} utilisé{(link.usedCount || 0) > 1 ? 's' : ''}
                  </span>
                  {/* Expiration */}
                  {link.expiresAt && <span style={{ color: 'var(--text-muted)' }}>
                    ⏰ {expired ? 'Expiré' : `Expire le ${new Date(link.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                  </span>}
                  {/* Date création */}
                  <span style={{ color: 'var(--text-light)' }}>
                    Créé le {new Date(link.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {/* Liste des personnes qui ont rejoint */}
                {(link.usedBy || []).length > 0 && (
                  <div style={{ marginTop: '.35rem', paddingTop: '.3rem', borderTop: '1px solid var(--border)' }}>
                    {link.usedBy.map((u, i) => (
                      <div key={i} style={{ fontSize: '.7rem', color: 'var(--text-muted)', display: 'flex', gap: '.3rem', alignItems: 'center', padding: '.1rem 0' }}>
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--green-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', fontWeight: 700, color: 'var(--green)' }}>{u.name?.charAt(0).toUpperCase()}</span>
                        <span>{u.name}</span>
                        <span style={{ opacity: .6 }}>{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
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
        <InviteManager tripId={trip.id} tripName={trip.name} ownerUid={trip.ownerUid || ''} />
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
