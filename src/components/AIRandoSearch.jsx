import { useState } from 'react'

const GEMINI_URL = '/.netlify/functions/gemini'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const days = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${days[date.getDay()]} ${d} ${months[m - 1]}`
}

async function callGemini(prompt) {
  const r = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  const json = await r.json()
  if (!r.ok || !json.ok) {
    throw new Error(json.error || `HTTP ${r.status}`)
  }
  // Le serveur renvoie { ok: true, data: [...] } — tableau déjà parsé
  return json.data
}

function parseJSON(text) {
  // Nettoie backticks markdown
  let s = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // Trouve le début du JSON ([ ou {)
  const arrStart = s.indexOf('[')
  const objStart = s.indexOf('{')
  let start = -1
  if (arrStart === -1) start = objStart
  else if (objStart === -1) start = arrStart
  else start = Math.min(arrStart, objStart)
  if (start === -1) throw new Error('Réponse invalide — aucun JSON trouvé')
  s = s.slice(start)
  // Trouve la fin du JSON en comptant les brackets
  const openChar = s[0]
  let depth = 0, end = -1, inStr = false, escape = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escape) { escape = false; continue }
    if (c === '\\') { escape = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end !== -1) s = s.slice(0, end + 1)
  // Fixe virgules trailing
  s = s.replace(/,\s*([}\]])/g, '$1')
  try {
    const result = JSON.parse(s)
    return Array.isArray(result) ? result : [result]
  } catch(e) {
    console.error('[parseJSON] échec:', e.message, 'texte:', s.slice(0, 200))
    throw new Error('Réponse invalide')
  }
}

function getErrorMsg(e) {
  const msg = e.message || ''
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand'))
    return '🔄 Gemini est surchargé — réessaie dans 1-2 minutes'
  if (msg.includes('502') || msg.includes('fetch failed'))
    return '⏱ Délai dépassé — réessaie dans quelques secondes'
  if (msg.includes('429') || msg.includes('quota'))
    return '⏳ Quota atteint — réessaie dans 1 heure'
  return 'Erreur : ' + msg
}

// ── Carte activité (mode recherche libre) ────────────────────────────────────

function ActivityCard({ act, days, targetDayId, selectedDayId, onSelectDay, onAdd }) {
  const [open, setOpen] = useState(false)
  const diffLabel = { facile: 'Facile', moyen: 'Intermédiaire', sportif: 'Sportif', repos: 'Repos' }[act.difficulty] || 'Intermédiaire'

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.85rem', marginBottom: '.65rem' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', cursor: 'pointer' }}>
        <span style={{ fontSize: '1.4rem' }}>{act.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{act.title}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{act.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span className={`badge badge-${act.difficulty || 'moyen'}`}>{diffLabel}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>

      <div className="stats" style={{ marginTop: '.4rem', marginBottom: open ? '.4rem' : 0 }}>
        {act.distanceKm > 0 && <span className="stat">📍 {act.distanceKm} km</span>}
        {act.dplus > 0 && <span className="stat">⬆️ {act.dplus}m D+</span>}
        {act.durationMin > 0 && <span className="stat">⏱ {Math.floor(act.durationMin / 60)}h{act.durationMin % 60 > 0 ? (act.durationMin % 60) + 'min' : ''}</span>}
        {act.price && <span className="stat">💰 {act.price}</span>}
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '.6rem', marginTop: '.4rem' }}>
          {act.desc && <div style={{ fontSize: '.8rem', color: 'var(--text)', marginBottom: '.4rem', lineHeight: 1.6 }}>{act.desc}</div>}
          {act.tip && <div style={{ fontSize: '.75rem', color: '#0a5040', background: 'var(--green-light)', padding: '4px 8px', borderRadius: 6, marginBottom: '.5rem' }}>💡 {act.tip}</div>}
          {act.gear?.length > 0 && (
            <div style={{ fontSize: '.78rem', marginBottom: '.4rem' }}>
              <strong>🎒 Matériel :</strong> {act.gear.join(', ')}
            </div>
          )}
          {!targetDayId && days?.length > 0 && (
            <select value={selectedDayId || ''} onChange={e => onSelectDay(e.target.value)}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 9px', fontSize: '.8rem', fontFamily: 'inherit', marginBottom: '.35rem', background: '#fff' }}>
              <option value="">Choisir un jour…</option>
              {days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          )}
          <button className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '.25rem', opacity: (!targetDayId && !selectedDayId) ? .5 : 1 }}
            disabled={!targetDayId && !selectedDayId}
            onClick={() => { const dayId = targetDayId || selectedDayId; if (dayId) onAdd(act, dayId) }}>
            ＋ Ajouter au planning
          </button>
        </div>
      )}
    </div>
  )
}

// ── Carte planning semaine (mode planning) ───────────────────────────────────

function PlanningDayCard({ dayPlan, dayObj, onAccept, onRefuse, onAlternative, status, alternative, altLoading }) {
  const act = alternative || dayPlan.activity
  const isAccepted = status === 'accepted'
  const isRefused = status === 'refused'

  return (
    <div style={{
      border: `2px solid ${isAccepted ? 'var(--green)' : isRefused ? 'var(--border)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      background: isAccepted ? 'var(--green-light)' : isRefused ? 'var(--gray-light)' : 'var(--card)',
      marginBottom: '.65rem',
      overflow: 'hidden',
      opacity: isRefused ? .55 : 1,
      transition: 'all .2s'
    }}>
      {/* Header jour */}
      <div style={{ padding: '.55rem .85rem', background: 'rgba(0,0,0,.03)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '.82rem' }}>
          {dayObj ? formatDate(dayObj.date) : dayPlan.dayLabel}
        </span>
        {isAccepted && <span style={{ fontSize: '.75rem', color: 'var(--green)', fontWeight: 600 }}>✓ Ajouté</span>}
        {isRefused && <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>✗ Refusé</span>}
      </div>

      {/* Activité */}
      <div style={{ padding: '.75rem .85rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', marginBottom: '.45rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{act.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{act.title}</div>
            <div style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginTop: 1 }}>{act.subtitle}</div>
          </div>
          <span className={`badge badge-${act.difficulty || 'moyen'}`}>
            {{ facile: 'Facile', moyen: 'Intermédiaire', sportif: 'Sportif', repos: 'Repos' }[act.difficulty] || 'Intermédiaire'}
          </span>
        </div>

        <div className="stats" style={{ marginBottom: '.45rem' }}>
          {act.distanceKm > 0 && <span className="stat">📍 {act.distanceKm} km</span>}
          {act.dplus > 0 && <span className="stat">⬆️ {act.dplus}m D+</span>}
          {act.durationMin > 0 && <span className="stat">⏱ {Math.floor(act.durationMin / 60)}h{act.durationMin % 60 > 0 ? (act.durationMin % 60) + 'min' : ''}</span>}
          {act.price && <span className="stat">💰 {act.price}</span>}
        </div>

        {act.desc && <div style={{ fontSize: '.78rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '.45rem' }}>{act.desc}</div>}
        {act.tip && <div style={{ fontSize: '.74rem', color: '#0a5040', background: 'var(--green-light)', padding: '4px 8px', borderRadius: 6, marginBottom: '.5rem' }}>💡 {act.tip}</div>}

        {/* Boutons */}
        {!isAccepted && !isRefused && (
          <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '.8rem' }}
              onClick={() => onAccept(act)}>
              ✓ Ajouter
            </button>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: '.8rem', color: 'var(--text-muted)' }}
              onClick={() => onRefuse()}>
              ✗ Passer
            </button>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: '.8rem' }}
              disabled={altLoading}
              onClick={() => onAlternative()}>
              {altLoading ? '⏳' : '🔄 Autre'}
            </button>
          </div>
        )}

        {isAccepted && (
          <button className="btn" style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.2rem' }}
            onClick={() => onRefuse()}>
            Annuler
          </button>
        )}
        {isRefused && (
          <button className="btn" style={{ fontSize: '.75rem', marginTop: '.2rem' }}
            onClick={() => onAccept(act)}>
            ↩ Rétablir
          </button>
        )}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AIRandoSearch({ trip, destination, days, targetDayId, onSelectActivity, onClose }) {
  const [mode, setMode] = useState('search') // 'search' | 'planning'

  // Mode recherche libre
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [selectedDayId, setSelectedDayId] = useState(targetDayId || null)

  // Mode planning semaine
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState(null)
  const [planDays, setPlanDays] = useState(null) // [{dayLabel, dayId, activity}]
  const [planStatus, setPlanStatus] = useState({}) // {dayId: 'accepted'|'refused'}
  const [planAlternatives, setPlanAlternatives] = useState({}) // {dayId: activity}
  const [altLoading, setAltLoading] = useState({}) // {dayId: bool}

  // ── Mode recherche libre ──

  const search = async () => {
    if (!query.trim()) return
    setLoading(true); setError(null); setResults(null)
    const existingActs = days?.flatMap(d => d.activities?.map(a => a.title) || []).join(', ') || 'aucune'
    const prompt = `Tu es un expert en activités de voyage à ${destination || 'France'}.
Recherche: "${query}"
Lieu: ${destination || 'France'}
Activités déjà planifiées: ${existingActs}

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown.
Format exact (3 activités):
[{"emoji":"🥾","title":"Nom","subtitle":"Court résumé","difficulty":"facile","distanceKm":5,"dplus":300,"durationMin":180,"price":"gratuit","desc":"Description courte","tip":"Conseil pratique","gear":["Item 1"],"links":[]}]
difficulty: facile | moyen | sportif | repos`

    try {
      const activities = await callGemini(prompt)
      if (!Array.isArray(activities) || activities.length === 0) throw new Error('Réponse vide')
      setResults(activities)
    } catch (e) { setError(getErrorMsg(e)) }
    finally { setLoading(false) }
  }

  // ── Mode planning semaine ──

  const buildTripContext = () => {
    const voyageurs = trip?.voyageurs?.length || 1
    const budget = trip?.budget ? `budget total ${trip.budget}€` : 'budget non précisé'
    const dateRange = trip?.startDate && trip?.endDate ? `du ${formatDate(trip.startDate)} au ${formatDate(trip.endDate)}` : ''
    const accom = trip?.accommodation ? `hébergement: ${trip.accommodation}` : ''
    const existingActs = days?.flatMap(d => d.activities?.map(a => a.title) || []).join(', ') || 'aucune'
    return `Lieu: ${destination}, ${dateRange}, ${voyageurs} voyageur(s), ${budget}${accom ? ', ' + accom : ''}. Activités déjà planifiées: ${existingActs}.`
  }

  const generatePlanning = async () => {
    setPlanLoading(true); setPlanError(null); setPlanDays(null)
    setPlanStatus({}); setPlanAlternatives({})

    const tripDays = days?.filter(d => d.date) || []
    if (tripDays.length === 0) { setPlanError('Aucun jour trouvé dans ce séjour.'); setPlanLoading(false); return }

    const daysList = tripDays.map((d, i) => `Jour ${i + 1} (${formatDate(d.date)}): ${d.title || 'Journée libre'} — activités existantes: ${d.activities?.map(a => a.title).join(', ') || 'aucune'}`).join('\n')
    const ctx = buildTripContext()

    const prompt = `Tu es un expert en voyages. Voici un séjour:
${ctx}

Jours du séjour:
${daysList}

Propose UN programme complet, une activité principale par jour, adaptée au lieu et aux voyageurs.
Ne propose pas d'activités déjà planifiées.

Réponds UNIQUEMENT avec un tableau JSON, une entrée par jour, sans texte avant ou après:
[{"dayIndex":0,"activity":{"emoji":"🥾","title":"Nom","subtitle":"Court résumé","difficulty":"facile","distanceKm":5,"dplus":300,"durationMin":180,"price":"gratuit","desc":"Description courte sans apostrophes","tip":"Conseil pratique sans apostrophes","gear":[]}}]
dayIndex = index du jour (0 = premier jour). difficulty: facile | moyen | sportif | repos`

    try {
      const parsed = await callGemini(prompt)
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Réponse vide')

      const result = parsed.map(item => ({
        dayId: tripDays[item.dayIndex]?.id,
        dayLabel: formatDate(tripDays[item.dayIndex]?.date),
        activity: item.activity
      })).filter(item => item.dayId)

      setPlanDays(result)
    } catch (e) { setPlanError(getErrorMsg(e)) }
    finally { setPlanLoading(false) }
  }

  const getAlternative = async (dayId, dayLabel, currentTitle) => {
    setAltLoading(prev => ({ ...prev, [dayId]: true }))
    const acceptedTitles = Object.entries(planStatus)
      .filter(([, s]) => s === 'accepted')
      .map(([id]) => planDays?.find(d => d.dayId === id)?.activity?.title || planAlternatives[id]?.title || '')
      .filter(Boolean)
    const ctx = buildTripContext()

    const prompt = `Tu es un expert en voyages. Séjour: ${ctx}
Pour le ${dayLabel}, propose UNE AUTRE activité (pas "${currentTitle}", pas: ${acceptedTitles.join(', ') || 'aucune'}).
Réponds UNIQUEMENT avec un objet JSON:
{"emoji":"🥾","title":"Nom","subtitle":"Court résumé","difficulty":"facile","distanceKm":0,"dplus":0,"durationMin":120,"price":"gratuit","desc":"Description courte","tip":"Conseil","gear":[]}`

    try {
      const altArr = await callGemini(prompt)
      const alt = Array.isArray(altArr) ? altArr[0] : altArr
      if (!alt || !alt.title) throw new Error('Activité invalide')
      setAltLoading(prev => ({ ...prev, [dayId]: false }))
      setPlanAlternatives(prev => ({ ...prev, [dayId]: alt }))
      // Reset status si refusé pour permettre de valider la nouvelle
      setPlanStatus(prev => prev[dayId] === 'refused' ? { ...prev, [dayId]: undefined } : prev)
    } catch (e) {
      setAltLoading(prev => ({ ...prev, [dayId]: false }))
    }
  }

  const acceptDay = (dayId, act) => {
    setPlanStatus(prev => ({ ...prev, [dayId]: 'accepted' }))
    onSelectActivity({ ...act, id: undefined, notes: [], done: false }, dayId)
  }

  const refuseDay = (dayId) => {
    setPlanStatus(prev => {
      const next = { ...prev }
      delete next[dayId]
      return { ...next, [dayId]: prev[dayId] === 'accepted' ? undefined : 'refused' }
    })
  }

  const acceptedCount = Object.values(planStatus).filter(s => s === 'accepted').length

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <h2>🤖 Activités IA</h2>

        {/* Sélecteur de mode */}
        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem', background: 'var(--gray-light)', borderRadius: 10, padding: '3px' }}>
          <button
            onClick={() => setMode('search')}
            style={{
              flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '.82rem', fontWeight: 500, fontFamily: 'inherit',
              background: mode === 'search' ? '#fff' : 'transparent',
              color: mode === 'search' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: mode === 'search' ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              transition: 'all .15s'
            }}>
            🔍 Recherche libre
          </button>
          <button
            onClick={() => setMode('planning')}
            style={{
              flex: 1, padding: '6px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '.82rem', fontWeight: 500, fontFamily: 'inherit',
              background: mode === 'planning' ? '#fff' : 'transparent',
              color: mode === 'planning' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: mode === 'planning' ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              transition: 'all .15s'
            }}>
            📅 Planning semaine
          </button>
        </div>

        {/* ── MODE RECHERCHE LIBRE ── */}
        {mode === 'search' && (
          <>
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Décris ce que tu cherches — Gemini te propose des activités adaptées à <strong>{destination || 'ta destination'}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="ex: rando facile avec enfants, spa, restaurant sympa, via ferrata..."
                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', fontSize: '.85rem', fontFamily: 'inherit', background: 'var(--bg)', outline: 'none' }}
              />
              <button className="btn btn-primary" onClick={search} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                {loading ? '⏳' : '🔍 Chercher'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {['Idées pour demain', 'Activité si il pleut', 'Sortie famille', 'Sport extrême', 'Bonne table', 'Détente et spa', 'Vue panoramique', 'Expérience locale'].map(s => (
                <button key={s} className="btn" style={{ fontSize: '.72rem' }} onClick={() => setQuery(s)}>{s}</button>
              ))}
            </div>
            {error && <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '.65rem .9rem', borderRadius: 8, fontSize: '.82rem', marginBottom: '1rem' }}>{error}</div>}
            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🤖</div>
                <div style={{ fontSize: '.85rem' }}>Gemini recherche des activités…</div>
              </div>
            )}
            {results && (
              <div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {results.length} activité{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
                </div>
                {results.map((act, i) => (
                  <ActivityCard key={i} act={act} days={days} targetDayId={targetDayId}
                    selectedDayId={selectedDayId} onSelectDay={setSelectedDayId}
                    onAdd={(a, dayId) => { onSelectActivity({ ...a, id: undefined, notes: [], done: false }, dayId); onClose() }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODE PLANNING SEMAINE ── */}
        {mode === 'planning' && (
          <>
            {/* Résumé du séjour */}
            <div style={{ background: 'var(--green-light)', borderRadius: 8, padding: '.65rem .9rem', marginBottom: '1rem', fontSize: '.8rem', color: 'var(--text)' }}>
              <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>📋 Séjour détecté</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong>{trip?.name}</strong> · {destination}
                {trip?.startDate && trip?.endDate && ` · ${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`}
                {trip?.voyageurs?.length > 0 && ` · ${trip.voyageurs.length} voyageur${trip.voyageurs.length > 1 ? 's' : ''}`}
                {trip?.budget && ` · Budget ${trip.budget}€`}
              </div>
            </div>

            {!planDays && !planLoading && (
              <>
                <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Gemini va générer un programme complet pour ton séjour, une activité par jour, adaptée à ton groupe et à la destination.
                </p>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '.88rem', padding: '10px' }}
                  onClick={generatePlanning}>
                  ✨ Générer le planning de la semaine
                </button>
              </>
            )}

            {planLoading && (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🤖</div>
                <div style={{ fontSize: '.85rem' }}>Gemini prépare ton programme…</div>
                <div style={{ fontSize: '.75rem', marginTop: '.35rem', opacity: .7 }}>Ça peut prendre 10-20 secondes</div>
              </div>
            )}

            {planError && (
              <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '.65rem .9rem', borderRadius: 8, fontSize: '.82rem', marginBottom: '1rem' }}>
                {planError}
                <button className="btn" style={{ marginTop: '.5rem', fontSize: '.78rem' }} onClick={generatePlanning}>🔄 Réessayer</button>
              </div>
            )}

            {planDays && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {acceptedCount} / {planDays.length} activité{planDays.length > 1 ? 's' : ''} ajoutée{acceptedCount > 1 ? 's' : ''}
                  </div>
                  <button className="btn" style={{ fontSize: '.72rem' }} onClick={generatePlanning}>🔄 Regénérer</button>
                </div>
                <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '.25rem' }}>
                  {planDays.map(({ dayId, dayLabel, activity }) => (
                    <PlanningDayCard
                      key={dayId}
                      dayPlan={{ dayLabel, activity }}
                      dayObj={days?.find(d => d.id === dayId)}
                      status={planStatus[dayId]}
                      alternative={planAlternatives[dayId]}
                      altLoading={altLoading[dayId]}
                      onAccept={(act) => acceptDay(dayId, act)}
                      onRefuse={() => refuseDay(dayId)}
                      onAlternative={() => getAlternative(dayId, dayLabel, planAlternatives[dayId]?.title || activity.title)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
