import { useState } from 'react'

// Proxy via Netlify Function (évite les blocages CORS)
const GEMINI_URL = '/.netlify/functions/gemini'

export default function AIRandoSearch({ destination, days, targetDayId, onSelectActivity, onClose }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [selectedDayId, setSelectedDayId] = useState(targetDayId || null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)

    const prompt = `Tu es un expert en randonnées en ${destination || 'France'}.
Recherche: "${query}"

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown.
Les champs desc, tip et gear ne doivent pas contenir d'apostrophes ou guillemets - utilise des formulations simples.
Format exact:
[{"emoji":"🥾","title":"Nom","subtitle":"Court","type":"rando","difficulty":"facile","distanceKm":5,"dplus":300,"durationMin":180,"startTime":"08:30","features":["lac"],"desc":"Description simple sans apostrophes","gear":["Item 1","Item 2"],"tip":"Conseil simple","links":[{"url":"https://www.alltrails.com","label":"AllTrails"}]}]

Propose 3 activités adaptées à la recherche.`

    try {
      // Retry once on 502
      let r
      for (let attempt = 0; attempt < 2; attempt++) {
        r = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        })
        if (r.status !== 502) break
        await new Promise(res => setTimeout(res, 1500))
      }
      const data = await r.json()
      if (!r.ok) throw new Error(data.details || data.error || `HTTP ${r.status}`)
      // gemini-2.5-flash uses thinking mode - may have multiple parts
      const parts = data?.candidates?.[0]?.content?.parts || []
      const text = parts.map(p => p.text || '').join('')

      // Extract and clean JSON from response
      let jsonStr = text
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      // Find the JSON array
      const start = jsonStr.indexOf('[')
      const end = jsonStr.lastIndexOf(']')
      if (start === -1 || end === -1) {
        console.error('No JSON array found in:', text.slice(0, 300))
        throw new Error('Réponse invalide — aucun JSON trouvé')
      }
      jsonStr = jsonStr.slice(start, end + 1)
      // Fix common JSON issues: remove trailing commas
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
      const activities = JSON.parse(jsonStr)
      if (!Array.isArray(activities) || activities.length === 0) throw new Error('Réponse vide')
      setResults(activities)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
        setError('🔄 Gemini est surchargé en ce moment — réessaie dans 1-2 minutes')
      } else if (msg.includes('502') || msg.includes('fetch failed')) {
        setError('⏱ Délai dépassé — réessaie dans quelques secondes')
      } else if (msg.includes('429') || msg.includes('quota')) {
        setError('⏳ Quota atteint — réessaie dans 1 heure')
      } else {
        setError('Erreur : ' + msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <h2>🤖 Recherche IA — Activités & Randos</h2>
        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Décris ce que tu cherches et Gemini te propose des activités adaptées à <strong>{destination || 'ta destination'}</strong>.
        </p>

        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="ex: idées quoi faire, escalade, spa, restaurant sympa, rando avec vue..."
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', fontSize: '.85rem', fontFamily: 'inherit', background: 'var(--bg)', outline: 'none' }}
          />
          <button className="btn btn-primary" onClick={search} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '⏳' : '🔍 Chercher'}
          </button>
        </div>

        {/* Suggestions rapides */}
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['Idées pour demain', 'Activité si il pleut', 'Sortie famille', 'Sport extrême', 'Bonne table', 'Détente et spa', 'Vue panoramique', 'Expérience locale'].map(s => (
            <button key={s} className="btn" style={{ fontSize: '.72rem' }}
              onClick={() => { setQuery(s); }}>
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '.65rem .9rem', borderRadius: 8, fontSize: '.82rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🤖</div>
            <div style={{ fontSize: '.85rem' }}>Gemini recherche des activités pour toi…</div>
          </div>
        )}

        {results && (
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {results.length} activité{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
            </div>
            {results.map((act, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '.85rem', marginBottom: '.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', marginBottom: '.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{act.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{act.title}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{act.subtitle}</div>
                  </div>
                  <span className={`badge badge-${act.difficulty || 'moyen'}`}>
                    {act.difficulty === 'facile' ? 'Facile' : act.difficulty === 'sportif' ? 'Sportif' : 'Intermédiaire'}
                  </span>
                </div>

                <div className="stats" style={{ marginBottom: '.4rem' }}>
                  {act.distanceKm > 0 && <span className="stat">📍 {act.distanceKm} km</span>}
                  {act.dplus > 0 && <span className="stat">⬆️ {act.dplus}m D+</span>}
                  {act.durationMin > 0 && <span className="stat">⏱ {Math.floor(act.durationMin/60)}h{act.durationMin%60 > 0 ? (act.durationMin%60)+'min' : ''}</span>}
                </div>

                {act.desc && <div style={{ fontSize: '.8rem', color: 'var(--text)', marginBottom: '.4rem', lineHeight: 1.6 }}>{act.desc}</div>}
                {act.tip && <div style={{ fontSize: '.75rem', color: '#0a5040', background: 'var(--green-light)', padding: '4px 8px', borderRadius: 6, marginBottom: '.5rem' }}>💡 {act.tip}</div>}

                {/* Day selector if no targetDayId */}
                {!targetDayId && days && days.length > 0 && (
                  <select
                    value={selectedDayId || ''}
                    onChange={e => setSelectedDayId(e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 9px', fontSize: '.8rem', fontFamily: 'inherit', marginBottom: '.35rem', background: '#fff' }}
                  >
                    <option value="">Choisir un jour…</option>
                    {days.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '.25rem', opacity: (!targetDayId && !selectedDayId) ? .5 : 1 }}
                  disabled={!targetDayId && !selectedDayId}
                  onClick={() => {
                    const dayId = targetDayId || selectedDayId
                    if (!dayId) return
                    onSelectActivity({ ...act, id: undefined, notes: [], done: false }, dayId)
                  }}>
                  ＋ Ajouter au planning
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
