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

    onSave({ id: initial?.id || genId('trip'), ...form, days })
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
