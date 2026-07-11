import { useState, useEffect } from 'react'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  return m
}

const CATEGORIES = [
  { id: 'vetements', label: 'Vêtements', icon: '👕' },
  { id: 'toilette', label: 'Toilette & Santé', icon: '🧴' },
  { id: 'tech', label: 'Tech & Documents', icon: '📱' },
  { id: 'rando', label: 'Matériel rando', icon: '🥾' },
  { id: 'nourriture', label: 'Nourriture', icon: '🍎' },
  { id: 'autre', label: 'Autre', icon: '📦' },
]

function getCat(item) { return CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1] }

export default function Valise({ items, voyageurs, activeVoyageurId, suggestions, onToggle, onAdd, onRemove, onUpdateQty, onUpdate }) {
  const [newText, setNewText] = useState('')
  const mob = useIsMobile()
  const [newCat, setNewCat] = useState('autre')
  const [filter, setFilter] = useState('all')

  const grouped = {}
  CATEGORIES.forEach(c => { grouped[c.id] = [] })
  items.forEach(item => {
    const catId = item.category || 'autre'
    if (!grouped[catId]) grouped[catId] = []
    grouped[catId].push(item)
  })

  const totalDone = items.filter(i => i.done).length
  const total = items.length
  const pct = total > 0 ? Math.round(totalDone / total * 100) : 0

  const handleAdd = () => {
    if (!newText.trim()) return
    onAdd(newText.trim(), newCat)
    setNewText('')
  }

  const addSuggestion = (text) => {
    onAdd(text, 'rando')
  }

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,.06)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: 'var(--green)', borderRadius: 20, transition: 'width .3s' }} />
        </div>
        <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{totalDone}/{total}</span>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '.3rem', marginBottom: '.75rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filter === 'all' ? 'var(--green)' : 'var(--border)'}`, background: filter === 'all' ? 'var(--green)' : 'transparent', color: filter === 'all' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>Tout ({total})</button>
        <button onClick={() => setFilter('todo')} style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filter === 'todo' ? 'var(--amber)' : 'var(--border)'}`, background: filter === 'todo' ? 'var(--amber)' : 'transparent', color: filter === 'todo' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>À faire ({total - totalDone})</button>
        <button onClick={() => setFilter('essential')} style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filter === 'essential' ? 'var(--red)' : 'var(--border)'}`, background: filter === 'essential' ? 'var(--red)' : 'transparent', color: filter === 'essential' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>Essentiels</button>
        <button onClick={() => setFilter('consumable')} style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filter === 'consumable' ? 'var(--blue)' : 'var(--border)'}`, background: filter === 'consumable' ? 'var(--blue)' : 'transparent', color: filter === 'consumable' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.75rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>Consommables</button>
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => {
        let catItems = grouped[cat.id] || []
        if (filter === 'todo') catItems = catItems.filter(i => !i.done)
        if (filter === 'essential') catItems = catItems.filter(i => i.essential)
        if (filter === 'consumable') catItems = catItems.filter(i => i.consumable)
        if (catItems.length === 0 && filter !== 'all') return null
        const catDone = (grouped[cat.id] || []).filter(i => i.done).length
        const catTotal = (grouped[cat.id] || []).length
        if (catTotal === 0 && filter === 'all') return null

        return (
          <div key={cat.id} style={{ marginBottom: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.3rem' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{cat.icon} {cat.label}</div>
              <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{catDone}/{catTotal}</span>
            </div>
            {catItems.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.35rem .5rem', borderRadius: 8, background: item.done ? 'var(--green-light)' : 'transparent', marginBottom: 2 }}>
                <button onClick={() => onToggle(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: 0, lineHeight: 1 }}>
                  {item.done ? '✅' : '⬜'}
                </button>
                <span style={{ flex: 1, fontSize: '.82rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text)' }}>
                  {item.text}
                </span>
                {item.qty > 1 && <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>x{item.qty}</span>}
                {item.essential && <span style={{ fontSize: mob ? '.55rem' : '.58rem', padding: '1px 5px', borderRadius: 4, background: 'var(--amber-light)', color: 'var(--amber)', fontWeight: 600 }}>Essentiel</span>}
                {item.consumable && <span style={{ fontSize: '.58rem', padding: '1px 5px', borderRadius: 4, background: 'var(--red-light)', color: 'var(--red)', fontWeight: 600 }}>Conso.</span>}
                {item.sharedWith && <span style={{ fontSize: '.58rem', padding: '1px 5px', borderRadius: 4, background: 'var(--blue-light)', color: 'var(--blue)' }}>{voyageurs.find(v => v.id === item.sharedWith)?.name || '?'} aussi</span>}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => onUpdateQty(item.id, (item.qty || 1) + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--text-muted)', padding: '2px' }}>＋</button>
                  {(item.qty || 1) > 1 && <button onClick={() => onUpdateQty(item.id, Math.max(1, (item.qty || 1) - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--text-muted)', padding: '2px' }}>−</button>}
                  <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--red)', padding: '2px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Suggestions from activities */}
      {suggestions?.length > 0 && (
        <div style={{ marginTop: '.5rem', padding: '.6rem .7rem', background: 'var(--blue-light)', borderRadius: 10, border: '1px solid rgba(55,138,221,.15)' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--blue)', fontWeight: 500, marginBottom: '.4rem' }}>✨ Suggestions basées sur tes activités</div>
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
            {suggestions.filter(s => !items.some(i => i.text.toLowerCase() === s.toLowerCase())).slice(0, 6).map((s, i) => (
              <button key={i} onClick={() => addSuggestion(s)} style={{ fontSize: '.72rem', padding: '3px 10px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)' }}>+ {s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Add item */}
      <div style={{ display: 'flex', gap: '.35rem', marginTop: '.65rem', alignItems: mob ? 'stretch' : 'center', flexDirection: mob ? 'column' : 'row' }}>
        <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Ajouter un item..." style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: '.82rem', fontFamily: 'inherit', background: 'var(--card)' }} />
        <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '7px 8px', fontSize: '.75rem', fontFamily: 'inherit', background: 'var(--card)', width: mob ? '100%' : 'auto' }}>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <button onClick={handleAdd} className="btn btn-primary" style={{ padding: '7px 14px', borderRadius: 8 }}>+</button>
      </div>
    </div>
  )
}
