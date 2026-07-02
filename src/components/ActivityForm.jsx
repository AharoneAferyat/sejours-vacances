import React, { useState } from 'react'
import { EMOJIS, ACTIVITY_TYPES, DIFFICULTY } from '../data/defaults'
import { genId } from '../utils'

// Mini toolbar pour les champs texte riches
const QUICK_EMOJIS = ['🥾','⛰️','🏞️','💦','🌲','🦌','🔭','☀️','⚡','🍽️','🏨','🚗','🚶','🌊','❄️','🌸','🍂']

function RichTextArea({ value, onChange, placeholder, rows = 3 }) {
  const ref = React.useRef(null)

  const insert = (before, after = '') => {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const selected = value.slice(s, e)
    const newVal = value.slice(0, s) + before + selected + after + value.slice(e)
    onChange(newVal)
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + selected.length) }, 0)
  }

  const insertEmoji = e => { onChange(value + e); ref.current?.focus() }

  return (
    <div>
      <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap', marginBottom: '.35rem', alignItems: 'center' }}>
        <button type="button" onClick={() => insert('**','**')} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontWeight: 700, fontSize: '.75rem' }}>G</button>
        <button type="button" onClick={() => insert('_','_')} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontStyle: 'italic', fontSize: '.75rem' }}>I</button>
        <span style={{ width: 1, background: 'var(--border)', height: 18, margin: '0 2px' }} />
        {QUICK_EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => insertEmoji(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.9rem', padding: '1px 2px', lineHeight: 1 }}>{e}</button>
        ))}
      </div>
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ width: '100%', fontFamily: 'inherit' }} />
    </div>
  )
}

function RichInput({ value, onChange, placeholder }) {
  const ref = React.useRef(null)

  const insert = (before, after = '') => {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const selected = value.slice(s, e)
    const newVal = value.slice(0, s) + before + selected + after + value.slice(e)
    onChange(newVal)
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + selected.length) }, 0)
  }

  const insertEmoji = e => { onChange(value + e); ref.current?.focus() }

  return (
    <div>
      <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap', marginBottom: '.25rem', alignItems: 'center' }}>
        <button type="button" onClick={() => insert('**','**')} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontWeight: 700, fontSize: '.75rem' }}>G</button>
        <button type="button" onClick={() => insert('_','_')} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontStyle: 'italic', fontSize: '.75rem' }}>I</button>
        <span style={{ width: 1, background: 'var(--border)', height: 18, margin: '0 2px' }} />
        {QUICK_EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => insertEmoji(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.9rem', padding: '1px 2px', lineHeight: 1 }}>{e}</button>
        ))}
      </div>
      <input ref={ref} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%' }} />
    </div>
  )
}


const FEATURES = [
  { id: 'lac', label: '🏞 Lac', cls: 'pill-lac' },
  { id: 'cascade', label: '💦 Cascade', cls: 'pill-cascade' },
  { id: 'faune', label: '🦌 Faune', cls: 'pill-faune' },
  { id: 'vue', label: '🔭 Vue', cls: 'pill-vue' },
]

const EMPTY = {
  emoji: '🥾', title: '', subtitle: '', type: 'rando', difficulty: 'facile',
  startTime: '', endTime: '', distanceKm: '', dplus: '', durationMin: '',
  features: [], desc: '', gear: '', tip: '',
  links: '', // "url|label,url|label"
  notes: [], done: false,
}

export default function ActivityForm({ initial, onSave, onClose, title = 'Nouvelle activité' }) {
  const [form, setForm] = useState(() => initial
    ? {
        ...initial,
        gear: (initial.gear || []).join(', '),
        links: (initial.links || []).map(l => `${l.url}|${l.label}`).join(','),
      }
    : EMPTY
  )

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const toggleFeature = (f) => set('features', form.features.includes(f)
    ? form.features.filter(x => x !== f)
    : [...form.features, f]
  )

  const handleSave = () => {
    if (!form.title.trim()) return alert('Titre requis')
    const gear = form.gear.split(',').map(x => x.trim()).filter(Boolean)
    const links = form.links.split(',').filter(x => x.includes('|')).map(x => {
      const [url, ...rest] = x.split('|')
      return { url: url.trim(), label: rest.join('|').trim() }
    })
    onSave({
      ...form,
      id: initial?.id || genId('act'),
      gear,
      links,
      distanceKm: parseFloat(form.distanceKm) || 0,
      dplus: parseFloat(form.dplus) || 0,
      durationMin: parseFloat(form.durationMin) || 0,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <h2>{title}</h2>

        {/* EMOJI */}
        <div className="form-group">
          <label>Icône</label>
          <div className="emoji-grid">
            {EMOJIS.map(e => (
              <button key={e} className={`emoji-btn${form.emoji === e ? ' sel' : ''}`}
                onClick={() => set('emoji', e)}>{e}</button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Difficulté</label>
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              {DIFFICULTY.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Titre *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: Cascade du Fornet" />
        </div>

        <div className="form-group">
          <label>Sous-titre</label>
          <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="ex: Forêt de mélèzes · chute d'eau" />
        </div>

        {/* FEATURES */}
        <div className="form-group">
          <label>Points d'intérêt</label>
          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.3rem' }}>
            {FEATURES.map(f => (
              <span key={f.id}
                className={`pill ${f.cls}`}
                style={{ cursor: 'pointer', opacity: form.features.includes(f.id) ? 1 : .4, padding: '4px 10px' }}
                onClick={() => toggleFeature(f.id)}
              >{f.label}</span>
            ))}
          </div>
        </div>

        {/* HORAIRES */}
        <div className="form-row">
          <div className="form-group">
            <label>Heure départ</label>
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Heure fin (estimée)</label>
            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>

        {/* STATS */}
        <div className="form-row">
          <div className="form-group">
            <label>Distance (km)</label>
            <input type="number" step="0.1" value={form.distanceKm}
              onChange={e => set('distanceKm', e.target.value)} placeholder="ex: 7.5" />
          </div>
          <div className="form-group">
            <label>D+ (mètres)</label>
            <input type="number" value={form.dplus}
              onChange={e => set('dplus', e.target.value)} placeholder="ex: 350" />
          </div>
        </div>

        <div className="form-group">
          <label>Durée estimée (minutes)</label>
          <input type="number" value={form.durationMin}
            onChange={e => set('durationMin', e.target.value)} placeholder="ex: 180 (= 3h)" />
        </div>

        <div className="form-group">
          <label>Description</label>
          <RichTextArea value={form.desc} onChange={v => set('desc', v)} placeholder="Détails du parcours, points d'intérêt…" rows={3} />
        </div>

        <div className="form-group">
          <label>Matériel recommandé (séparé par virgules)</label>
          <input value={form.gear} onChange={e => set('gear', e.target.value)}
            placeholder="ex: Bâtons de marche, Eau 1,5L, Coupe-vent" />
        </div>

        <div className="form-group">
          <label>Liens (URL|Titre, séparés par virgules)</label>
          <input value={form.links} onChange={e => set('links', e.target.value)}
            placeholder="https://alltrails.com/...|AllTrails, https://visorando.com/...|Visorando" />
        </div>

        <div className="form-group">
          <label>Conseil / astuce</label>
          <RichInput value={form.tip} onChange={v => set('tip', v)} placeholder="ex: Partir avant 8h, orages l'après-midi" />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {initial ? '✓ Enregistrer' : '＋ Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
