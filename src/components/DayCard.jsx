import { useState } from 'react'
import { DIFFICULTY } from '../data/defaults'
import { calcDayStats, formatDuration, formatDateShort, displayToISO } from '../utils'
import ActivityForm from './ActivityForm'

const FEATURE_MAP = {
  lac: ['pill-lac', '🏞 Lac'],
  cascade: ['pill-cascade', '💦 Cascade'],
  faune: ['pill-faune', '🦌 Faune'],
  vue: ['pill-vue', '🔭 Vue'],
}

function MoveModal({ onMove, onClose }) {
  const [display, setDisplay] = useState('')

  const handleChange = (e) => {
    let v = e.target.value.replace(/[^\d/]/g, '')
    const digits = v.replace(/\D/g, '')
    if (digits.length <= 2) v = digits
    else if (digits.length <= 4) v = digits.slice(0,2) + '/' + digits.slice(2)
    else v = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4,8)
    setDisplay(v)
  }

  const handleConfirm = () => {
    const iso = displayToISO(display)
    if (!iso) return alert('Date invalide — format JJ/MM/AAAA')
    onMove(iso)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 340 }}>
        <h2>📅 Déplacer l'activité</h2>
        <div className="form-group">
          <label>Nouvelle date (JJ/MM/AAAA)</label>
          <input value={display} onChange={handleChange} placeholder="ex: 09/07/2026" maxLength={10} />
        </div>
        <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
          Si la date n'existe pas encore dans le planning, elle sera créée automatiquement.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleConfirm}>Déplacer</button>
        </div>
      </div>
    </div>
  )
}

function ActivityDetail({ act, onUpdate, onDelete, onMove, onValidate }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)

  const diff = DIFFICULTY.find(d => d.id === act.difficulty) || DIFFICULTY[0]

  return (
    <>
      <div className="act-main" onClick={() => setOpen(o => !o)}>
        <div className="act-main-icon" style={{ background: diff.color }}>
          {act.emoji}
        </div>
        <div className="act-main-info">
          <div className="act-main-title" style={act.done ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : {}}>
            {act.title}
          </div>
          {act.subtitle && <div className="act-main-sub">{act.subtitle}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span className={`badge badge-${act.difficulty}`}>{diff.label}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>

      {open && (
        <div className="act-detail">
          {/* Stats */}
          {(act.distanceKm > 0 || act.dplus > 0 || act.durationMin > 0 || act.startTime) && (
            <div className="stats">
              {act.distanceKm > 0 && <span className="stat">📍 {act.distanceKm} km</span>}
              {act.dplus > 0 && <span className="stat">⬆️ {act.dplus}m D+</span>}
              {act.durationMin > 0 && <span className="stat">⏱ {formatDuration(act.durationMin)}</span>}
              {act.startTime && (
                <span className="stat">🕗 {act.startTime}{act.endTime ? `–${act.endTime}` : ''}</span>
              )}
            </div>
          )}

          {/* Features */}
          {(act.features || []).length > 0 && (
            <div className="pills">
              {act.features.map(f => FEATURE_MAP[f] && (
                <span key={f} className={`pill ${FEATURE_MAP[f][0]}`}>{FEATURE_MAP[f][1]}</span>
              ))}
            </div>
          )}

          {/* Links */}
          {(act.links || []).length > 0 && (
            <div className="links">
              {act.links.map((l, i) => (
                <a key={i} className="ext-link" href={l.url} target="_blank" rel="noreferrer">
                  🗺 {l.label} ↗
                </a>
              ))}
            </div>
          )}

          {/* Gear */}
          {(act.gear || []).length > 0 && (
            <div className="gear-block">
              <strong>🎒 Matériel recommandé</strong>
              <ul>{act.gear.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}

          {/* Desc */}
          {act.desc && (
            <div className="desc" dangerouslySetInnerHTML={{ __html: act.desc }} />
          )}

          {/* Tip */}
          {act.tip && <div className="tip">💡 {act.tip}</div>}

          {/* Actions */}
          <div className="card-actions">
            <button className={`btn btn-validate${act.done ? ' done' : ''}`} onClick={onValidate}>
              {act.done ? '✅ Validée' : '○ Valider'}
            </button>
            <button className="btn" onClick={() => setEditing(true)}>✏️ Modifier</button>
            <button className="btn" onClick={() => setMoving(true)}>📅 Déplacer</button>
            <button className="btn btn-danger"
              onClick={() => confirm('Supprimer cette activité ?') && onDelete()}>🗑</button>
          </div>
        </div>
      )}

      {editing && (
        <ActivityForm
          initial={act}
          title="Modifier l'activité"
          onSave={(updated) => { onUpdate(updated); setEditing(false) }}
          onClose={() => setEditing(false)}
        />
      )}

      {moving && (
        <MoveModal
          onMove={(date) => { onMove(date); setMoving(false) }}
          onClose={() => setMoving(false)}
        />
      )}
    </>
  )
}

export default function DayCard({ day, tripId, isToday, onValidateDay, onDeleteDay,
  onAddActivity, onUpdateActivity, onDeleteActivity, onMoveActivity, onValidateActivity, onAISearch }) {
  const [showForm, setShowForm] = useState(false)

  const stats = calcDayStats(day.activities)

  return (
    <>
      <div className={`card${isToday ? ' today' : ''}`}>
        <div className="card-header" style={{ cursor: 'default' }}>
          <div className="card-icon" style={{ background: 'var(--blue-light)', fontSize: '.9rem' }}>
            {isToday ? '📍' : '📅'}
          </div>
          <div className="card-info">
            <div className="card-title">
              {isToday && <span style={{ color: 'var(--green-mid)' }}>▶ </span>}
              {day.label}
            </div>
            {(stats.totalKm > 0 || stats.totalMin > 0) && (
              <div className="card-sub">
                {stats.totalKm > 0 && `${stats.totalKm}km`}
                {stats.totalDplus > 0 && ` · ${stats.totalDplus}m D+`}
                {stats.totalMin > 0 && ` · ${formatDuration(stats.totalMin)}`}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div className={`check-circle${day.validated ? ' done' : ''}`}
              onClick={onValidateDay} title="Valider la journée">
              {day.validated ? '✓' : ''}
            </div>
            <button className="btn-icon"
              onClick={() => confirm('Supprimer ce jour et toutes ses activités ?') && onDeleteDay()}
              title="Supprimer le jour">🗑</button>
          </div>
        </div>

        <div style={{ padding: '.15rem .9rem .8rem' }}>
          {/* Activities list */}
          {day.activities.map(act => (
            <ActivityDetail
              key={act.id}
              act={act}
              onUpdate={(updated) => onUpdateActivity(day.id, act.id, updated)}
              onDelete={() => onDeleteActivity(day.id, act.id)}
              onMove={(date) => onMoveActivity(day.id, act.id, date)}
              onValidate={() => onValidateActivity(day.id, act.id)}
            />
          ))}

          {/* Add activity button */}
          <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', borderStyle: 'dashed' }}
              onClick={() => setShowForm(true)}>＋ Ajouter une activité</button>
            <button className="btn" style={{ fontSize: '.72rem', whiteSpace: 'nowrap' }}
              onClick={() => onAISearch && onAISearch(day.id)}>🤖 IA</button>
          </div>
        </div>
      </div>

      {showForm && (
        <ActivityForm
          title="Nouvelle activité"
          onSave={(act) => { onAddActivity(day.id, act); setShowForm(false) }}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
