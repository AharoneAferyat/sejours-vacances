import { useState, useEffect } from 'react'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  return m
}

export default function SacADos({ baseItems, days, voyageurs, activeVoyageurId, onToggle, onAdd, onRemove, onUpdateQty, onUpdate, onMoveToValise }) {
  const [activeTab, setActiveTab] = useState('base')
  const [newText, setNewText] = useState('')
  const mob = useIsMobile()

  const sharedItems = baseItems.filter(i => i.shared)
  const myBase = baseItems.filter(i => !i.shared)

  // Per-day items are stored in day.sacExtras[voyageurId]
  const activeDay = days.find(d => d.id === activeTab)
  const dayExtras = activeDay?.sacExtras?.[activeVoyageurId] || []

  const handleAddBase = () => {
    if (!newText.trim()) return
    onAdd(newText.trim())
    setNewText('')
  }

  const handleAddDayExtra = () => {
    if (!newText.trim() || !activeDay) return
    const extra = { id: 'se_' + Date.now(), text: newText.trim(), done: false }
    const currentExtras = activeDay.sacExtras?.[activeVoyageurId] || []
    onUpdate(activeDay.id, { sacExtras: { ...(activeDay.sacExtras || {}), [activeVoyageurId]: [...currentExtras, extra] } })
    setNewText('')
  }

  const toggleDayExtra = (itemId) => {
    if (!activeDay) return
    const currentExtras = activeDay.sacExtras?.[activeVoyageurId] || []
    onUpdate(activeDay.id, { sacExtras: { ...(activeDay.sacExtras || {}), [activeVoyageurId]: currentExtras.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } })
  }

  const removeDayExtra = (itemId) => {
    if (!activeDay) return
    const currentExtras = activeDay.sacExtras?.[activeVoyageurId] || []
    onUpdate(activeDay.id, { sacExtras: { ...(activeDay.sacExtras || {}), [activeVoyageurId]: currentExtras.filter(i => i.id !== itemId) } })
  }

  const baseDone = myBase.filter(i => i.done).length
  const isBase = activeTab === 'base'

  return (
    <div>
      {/* Tabs: Base + days */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1rem', borderBottom: '2px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => setActiveTab('base')} style={{
          padding: mob ? '.35rem .6rem' : '.4rem .85rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '.8rem', fontWeight: isBase ? 600 : 400, color: isBase ? 'var(--green)' : 'var(--text-muted)',
          borderBottom: isBase ? '2px solid var(--green)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap'
        }}>🎒 Base</button>
        {days.map(d => {
          const isActive = activeTab === d.id
          const extras = d.sacExtras?.[activeVoyageurId] || []
          return (
            <button key={d.id} onClick={() => setActiveTab(d.id)} style={{
              padding: mob ? '.3rem .5rem' : '.4rem .7rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '.78rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--green)' : 'var(--text-muted)',
              borderBottom: isActive ? '2px solid var(--green)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap'
            }}>
              {d.label?.split('.')[0]}.
              {extras.length > 0 && <span style={{ fontSize: '.6rem', marginLeft: 3, color: 'var(--text-muted)' }}>+{extras.length}</span>}
            </button>
          )
        })}
      </div>

      {/* BASE TAB */}
      {isBase && (
        <div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Ces items sont dans ton sac chaque jour :</div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(0,0,0,.06)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (myBase.length > 0 ? baseDone / myBase.length * 100 : 0) + '%', background: 'var(--green)', borderRadius: 20 }} />
            </div>
            <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{baseDone}/{myBase.length}</span>
          </div>

          {myBase.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.35rem .5rem', borderRadius: 8, background: item.done ? 'var(--green-light)' : 'transparent', marginBottom: 2 }}>
              <button onClick={() => onToggle(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: 0 }}>{item.done ? '✅' : '⬜'}</button>
              <span style={{ flex: 1, fontSize: '.82rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text)' }}>{item.text}</span>
              {item.consumable && <span style={{ fontSize: '.58rem', padding: '1px 5px', borderRadius: 4, background: 'var(--red-light)', color: 'var(--red)', fontWeight: 600 }}>Conso.</span>}
                            {onMoveToValise && <button onClick={() => { onMoveToValise(item); onRemove(item.id) }} title="Déplacer dans la valise" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.7rem', color: 'var(--blue)', padding: '2px' }}>🧳→</button>}
              <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--red)', padding: '2px' }}>✕</button>
            </div>
          ))}

          {/* Shared items */}
          {sharedItems.length > 0 && (
            <div style={{ marginTop: '.65rem', padding: '.55rem .65rem', background: 'var(--blue-light)', borderRadius: 10, border: '1px solid rgba(55,138,221,.15)' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--blue)', fontWeight: 500, marginBottom: '.35rem' }}>👥 Items partagés (un seul prend pour le groupe)</div>
              {sharedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.25rem 0', fontSize: '.8rem' }}>
                  <span>{item.text}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.68rem', padding: '1px 6px', borderRadius: 4, background: 'var(--card)', color: 'var(--blue)' }}>
                    {voyageurs.find(v => v.id === item.sharedWith)?.name || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.65rem' }}>
            <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddBase()} placeholder="Ajouter au sac de base..." style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: '.82rem', fontFamily: 'inherit', background: 'var(--card)' }} />
            <button onClick={handleAddBase} className="btn btn-primary" style={{ padding: '7px 14px', borderRadius: 8 }}>+</button>
          </div>
        </div>
      )}

      {/* DAY TAB */}
      {!isBase && activeDay && (
        <div>
          <div style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: '.3rem' }}>{activeDay.label}</div>
          {activeDay.activities?.length > 0 && (
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Activités : {activeDay.activities.map(a => `${a.emoji || '🎯'} ${a.title}`).join(', ')}
            </div>
          )}

          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>Items supplémentaires pour cette journée :</div>

          {dayExtras.length === 0 && (
            <div style={{ padding: '.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.82rem', background: 'var(--bg)', borderRadius: 10 }}>
              Pas d'items supplémentaires. Le sac de base suffit !
            </div>
          )}

          {dayExtras.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.35rem .5rem', borderRadius: 8, background: item.done ? 'var(--green-light)' : 'transparent', marginBottom: 2 }}>
              <button onClick={() => toggleDayExtra(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: 0 }}>{item.done ? '✅' : '⬜'}</button>
              <span style={{ flex: 1, fontSize: '.82rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text)' }}>{item.text}</span>
              <button onClick={() => removeDayExtra(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--red)', padding: '2px' }}>✕</button>
            </div>
          ))}

          {/* Gear suggestions from activities */}
          {activeDay.activities?.some(a => a.gear?.length > 0) && (
            <div style={{ marginTop: '.5rem', padding: '.5rem .6rem', background: 'var(--amber-light)', borderRadius: 8 }}>
              <div style={{ fontSize: '.68rem', color: 'var(--amber)', fontWeight: 500, marginBottom: '.3rem' }}>💡 Matériel recommandé pour les activités</div>
              <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
                {activeDay.activities.flatMap(a => a.gear || []).filter((g, i, arr) => arr.indexOf(g) === i).filter(g => !dayExtras.some(e => e.text.toLowerCase() === g.toLowerCase())).map((g, i) => (
                  <button key={i} onClick={() => { onUpdate(activeDay.id, { sacExtras: { ...(activeDay.sacExtras || {}), [activeVoyageurId]: [...dayExtras, { id: 'se_' + Date.now() + i, text: g, done: false }] } }) }}
                    style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}>+ {g}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.65rem' }}>
            <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddDayExtra()} placeholder="Ajouter pour cette journée..." style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: '.82rem', fontFamily: 'inherit', background: 'var(--card)' }} />
            <button onClick={handleAddDayExtra} className="btn btn-primary" style={{ padding: '7px 14px', borderRadius: 8 }}>+</button>
          </div>
        </div>
      )}
    </div>
  )
}
