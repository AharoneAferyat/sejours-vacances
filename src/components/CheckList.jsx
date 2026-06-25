import { useState } from 'react'

export default function CheckList({ items, onToggle, onAdd, onRemove, emptyEmoji = '📋' }) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

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

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '.83rem' }}>
          {emptyEmoji} Rien pour l'instant
        </div>
      )}

      {items.map(item => (
        <div key={item.id} className="check-item">
          <div className="check-item-icon" style={{ background: item.done ? 'var(--green-light)' : '#f1efe8' }}>
            {item.done ? '✓' : emptyEmoji}
          </div>
          <div className={`check-item-text${item.done ? ' done' : ''}`}>{item.text}</div>
          <div className={`check-circle${item.done ? ' done' : ''}`} onClick={() => onToggle(item.id)}>
            {item.done ? '✓' : ''}
          </div>
          <button className="btn-icon" onClick={() => onRemove(item.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
