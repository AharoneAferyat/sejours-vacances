import { useState, useEffect } from 'react'
import { genId, getDaysBetween, formatDate } from '../utils'
import { geocodeAddress } from '../hooks/useWeather'

function DateInput({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ cursor: 'pointer' }}
      />
      {value && (
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
          {new Date(value + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}

const COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46','#92400E','#1E3A5F']

export default function TripForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => initial ? {
    name: initial.name, subtitle: initial.subtitle || '',
    destination: initial.destination || '',
    accommodation: initial.accommodation || '',
    accommodationPhone: initial.accommodationPhone || '',
    startDate: initial.startDate || '', endDate: initial.endDate || '',
    color: initial.color || '#0F6E56',
    lat: initial.lat || null, lon: initial.lon || null,
  } : {
    name: '', subtitle: '', destination: '', accommodation: '',
    accommodationPhone: '', startDate: '', endDate: '',
    color: '#185FA5', lat: null, lon: null,
  })

  // Multi-destination: extra destinations (the first one uses main form fields)
  const existingDests = initial?.destinations || []
  const [extraDests, setExtraDests] = useState(
    existingDests.length > 1 ? existingDests.slice(1).map(d => ({
      id: d.id, name: d.name || '', startDate: d.startDate || '', endDate: d.endDate || '',
      accommodation: d.accommodation || '', color: d.color || '#A32D2D',
      lat: d.lat || null, lon: d.lon || null,
    })) : []
  )
  const [showAddExtra, setShowAddExtra] = useState(false)

  const [geocoding, setGeocoding] = useState(false)
  const [geoResult, setGeoResult] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const nbDays = form.startDate && form.endDate && form.endDate >= form.startDate
    ? getDaysBetween(form.startDate, form.endDate).length : null

  const handleGeocode = async () => {
    const addr = form.accommodation || form.destination
    if (!addr) return alert("Entrez une adresse ou une destination d'abord")
    setGeocoding(true)
    const res = await geocodeAddress(addr)
    setGeocoding(false)
    if (res) {
      setGeoResult(res.name)
      setForm(f => ({ ...f, lat: res.lat, lon: res.lon }))
    } else {
      alert('Adresse non trouvée — vérifiez le nom de la ville')
    }
  }

  const handleSave = () => {
    if (!form.name.trim()) return alert('Nom du séjour requis')
    if (!form.startDate || !form.endDate) return alert('Dates requises (JJ/MM/AAAA)')
    if (form.endDate < form.startDate) return alert('Date de fin avant date de début')

    const validDates = new Set(getDaysBetween(form.startDate, form.endDate))

    let days
    if (initial) {
      // Keep existing days that are IN the range (preserving activities)
      const kept = initial.days.filter(d => validDates.has(d.date))
      const keptDates = new Set(kept.map(d => d.date))
      // Add new dates not already present
      const added = [...validDates].filter(d => !keptDates.has(d)).map(date => ({
        id: genId('day'), date, label: formatDate(date),
        type: 'rando', validated: false, activities: []
      }))
      days = [...kept, ...added].sort((a, b) => a.date.localeCompare(b.date))
    } else {
      days = [...validDates].sort().map(date => ({
        id: genId('day'), date, label: formatDate(date),
        type: date === form.startDate || date === form.endDate ? 'voyage' : 'rando',
        validated: false, activities: []
      }))
    }

    onSave({ id: initial?.id || genId('trip'), ...form, days, ...(extraDests.length > 0 ? {
      destinations: [
        { id: existingDests[0]?.id || 'dest_main', name: form.destination, startDate: form.startDate, endDate: form.endDate, color: form.color, lat: form.lat, lon: form.lon, headerPhoto: initial?.headerPhoto || null, accommodation: form.accommodation, accommodationPhone: form.accommodationPhone, days },
        ...extraDests.map(ed => {
          const edDates = ed.startDate && ed.endDate ? getDaysBetween(ed.startDate, ed.endDate) : []
          const existDest = existingDests.find(d => d.id === ed.id)
          let edDays
          if (existDest?.days) {
            const kept = existDest.days.filter(d => edDates.includes(d.date))
            const keptDates = new Set(kept.map(d => d.date))
            const added = edDates.filter(d => !keptDates.has(d)).map(date => ({ id: genId('day'), date, label: formatDate(date), validated: false, activities: [] }))
            edDays = [...kept, ...added].sort((a, b) => a.date.localeCompare(b.date))
          } else {
            edDays = edDates.sort().map(date => ({ id: genId('day'), date, label: formatDate(date), validated: false, activities: [] }))
          }
          return { id: ed.id || genId('dest'), name: ed.name, startDate: ed.startDate, endDate: ed.endDate, color: ed.color, lat: ed.lat, lon: ed.lon, headerPhoto: existDest?.headerPhoto || null, accommodation: ed.accommodation, accommodationPhone: '', days: edDays }
        })
      ]
    } : {}) })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <h2>{initial ? '✏️ Modifier le séjour' : '✈️ Nouveau séjour'}</h2>

        <div className="form-group">
          <label>Nom du séjour *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Val d'Isère, Barcelone…" />
        </div>

        <div className="form-group">
          <label>Sous-titre</label>
          <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="ex: Lacs & Cascades" />
        </div>

        <div className="form-row">
          <DateInput label="Date d'arrivée *" value={form.startDate} onChange={v => set('startDate', v)} />
          <DateInput label="Date de départ *" value={form.endDate} onChange={v => set('endDate', v)} />
        </div>

        {nbDays !== null && (
          <div style={{ fontSize: '.78rem', color: 'var(--green)', marginBottom: '.75rem', fontWeight: 500 }}>
            ✓ {nbDays} jour{nbDays > 1 ? 's' : ''}
            {initial
              ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · les jours hors de cette plage seront supprimés, les nouveaux ajoutés</span>
              : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {nbDays} journées créées automatiquement</span>}
          </div>
        )}

        <div className="form-group">
          <label>Adresse hébergement</label>
          <input value={form.accommodation} onChange={e => set('accommodation', e.target.value)}
            placeholder="ex: 116 Avenue Olympique, 73150 Val d'Isère" />
        </div>

        <div className="form-group">
          <label>Destination (ville)</label>
          <input value={form.destination} onChange={e => set('destination', e.target.value)}
            placeholder="ex: Val d'Isère, Barcelone…" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
          <button className="btn btn-primary" onClick={handleGeocode} disabled={geocoding} style={{ fontSize: '.78rem' }}>
            {geocoding ? '⏳ Recherche…' : '📍 Localiser pour la météo'}
          </button>
          {form.lat && (
            <span style={{ fontSize: '.75rem', color: 'var(--green)', fontWeight: 500 }}>
              ✓ {geoResult ? geoResult.split(',')[0] : `${form.lat?.toFixed(3)}, ${form.lon?.toFixed(3)}`}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Téléphone hébergement</label>
          <input value={form.accommodationPhone} onChange={e => set('accommodationPhone', e.target.value)}
            placeholder="ex: 04 79 06 19 65" />
        </div>

        <div className="form-group">
          <label>Couleur du séjour</label>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.3rem' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => set('color', c)} style={{
                width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
                border: form.color === c ? '3px solid #1a1a18' : '3px solid transparent',
                boxShadow: form.color === c ? '0 0 0 2px #fff, 0 0 0 4px ' + c : 'none',
                transition: 'all .15s',
              }} />
            ))}
          </div>
        </div>

        {/* ── ÉTAPES SUPPLÉMENTAIRES ── */}
        {extraDests.length > 0 && (
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Étapes supplémentaires</div>
            {extraDests.map((ed, idx) => (
              <div key={ed.id || idx} style={{ background: 'var(--bg)', borderRadius: 12, padding: '.75rem', marginBottom: '.4rem', border: `2px solid ${ed.color || 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: ed.color }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 600 }}>Étape {idx + 2}</span>
                  </div>
                  <button onClick={() => setExtraDests(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', color: 'var(--red)' }}>✕ Supprimer</button>
                </div>
                <div className="form-group" style={{ marginBottom: '.4rem' }}>
                  <input value={ed.name} onChange={e => setExtraDests(prev => prev.map((d, i) => i === idx ? { ...d, name: e.target.value } : d))} placeholder="Destination (ex: Grenoble)" style={{ fontSize: '.82rem' }} />
                </div>
                <div className="form-row" style={{ gap: '.4rem', marginBottom: '.4rem' }}>
                  <div className="form-group"><input type="date" value={ed.startDate} onChange={e => setExtraDests(prev => prev.map((d, i) => i === idx ? { ...d, startDate: e.target.value } : d))} style={{ fontSize: '.8rem' }} /></div>
                  <div className="form-group"><input type="date" value={ed.endDate} onChange={e => setExtraDests(prev => prev.map((d, i) => i === idx ? { ...d, endDate: e.target.value } : d))} style={{ fontSize: '.8rem' }} /></div>
                </div>
                <div className="form-group" style={{ marginBottom: '.3rem' }}>
                  <input value={ed.accommodation} onChange={e => setExtraDests(prev => prev.map((d, i) => i === idx ? { ...d, accommodation: e.target.value } : d))} placeholder="Hébergement (optionnel)" style={{ fontSize: '.82rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setExtraDests(prev => prev.map((d, i) => i === idx ? { ...d, color: c } : d))} style={{
                      width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: ed.color === c ? '2px solid #1a1a18' : '2px solid transparent',
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => {
          const usedColors = [form.color, ...extraDests.map(d => d.color)]
          const nextColor = COLORS.find(c => !usedColors.includes(c)) || COLORS[2]
          setExtraDests(prev => [...prev, { id: genId('dest'), name: '', startDate: '', endDate: '', accommodation: '', color: nextColor, lat: null, lon: null }])
        }} style={{
          width: '100%', padding: '.5rem', border: '2px dashed var(--border)', borderRadius: 10,
          background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem',
          color: 'var(--text-muted)', marginBottom: '.75rem', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '.3rem'
        }}>📍 Ajouter une étape</button>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {initial ? '✓ Enregistrer' : '✈️ Créer le séjour'}
          </button>
        </div>
      </div>
    </div>
  )
}
