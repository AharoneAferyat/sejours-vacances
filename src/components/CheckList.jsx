import { useState } from 'react'

function CheckItem({ item, onToggle, onRemove, onUpdateQty, emptyEmoji }) {
  const [editingQty, setEditingQty] = useState(false)
  const qty = item.qty || 1

  return (
    <div className="check-item">
      <div className="check-item-icon" style={{ background: item.done ? 'var(--green-light)' : '#f1efe8' }}>
        {item.done ? '✓' : emptyEmoji}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <div className={`check-item-text${item.done ? ' done' : ''}`} style={{ flex: 1 }}>{item.text}</div>

        {/* Quantity badge */}
        {editingQty ? (
          <input
            type="number" min="1" max="99"
            defaultValue={qty}
            autoFocus
            onBlur={e => { onUpdateQty(parseInt(e.target.value) || 1); setEditingQty(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onUpdateQty(parseInt(e.target.value) || 1); setEditingQty(false) } if (e.key === 'Escape') setEditingQty(false) }}
            style={{ width: 44, border: '1px solid var(--green)', borderRadius: 6, padding: '2px 5px', fontSize: '.78rem', textAlign: 'center', fontFamily: 'inherit', outline: 'none' }}
          />
        ) : (
          <button
            onClick={() => setEditingQty(true)}
            title="Modifier la quantité"
            style={{
              background: qty > 1 ? 'var(--green)' : 'var(--gray-light)',
              color: qty > 1 ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 20, padding: '2px 8px',
              fontSize: '.72rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', minWidth: 28, textAlign: 'center',
              flexShrink: 0
            }}
          >
            {qty > 1 ? `×${qty}` : '×1'}
          </button>
        )}
      </div>

      <div className={`check-circle${item.done ? ' done' : ''}`} onClick={() => onToggle(item.id)}>
        {item.done ? '✓' : ''}
      </div>
      <button className="btn-icon" onClick={() => onRemove(item.id)}>✕</button>
    </div>
  )
}

export default function CheckList({ items, onToggle, onAdd, onRemove, onUpdateQty, emptyEmoji = '📋' }) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  const done = items.filter(i => i.done).length
  const total = items.reduce((s, i) => s + (i.qty || 1), 0)
  const donePcs = items.filter(i => i.done).reduce((s, i) => s + (i.qty || 1), 0)

  return (
    <div style={{ width: '100%' }}>
      {/* ADD ROW — en haut */}
      <div className="add-row" style={{ marginBottom: '.75rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ajouter un élément…"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd}>＋</button>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="progress-wrap" style={{ marginBottom: '.5rem' }}>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: total > 0 ? (donePcs/total*100)+'%' : '0%' }} />
          </div>
          <div className="progress-text">{donePcs}/{total}</div>
        </div>
      )}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '.83rem' }}>
          {emptyEmoji} Rien pour l'instant
        </div>
      )}

      {items.map(item => (
        <CheckItem
          key={item.id}
          item={item}
          emptyEmoji={emptyEmoji}
          onToggle={onToggle}
          onRemove={onRemove}
          onUpdateQty={(qty) => onUpdateQty && onUpdateQty(item.id, qty)}
        />
      ))}
    </div>
  )
}
