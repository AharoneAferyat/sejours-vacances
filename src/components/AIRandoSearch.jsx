import { useState } from 'react'

// Proxy via Netlify Function (évite les blocages CORS)
const GEMINI_URL = '/.netlify/functions/gemini'

export default function AIRandoSearch({ destination, onSelectActivity, onClose }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)

    const prompt = `Tu es un expert en randonnées et activités outdoor en ${destination || 'France'}.
L'utilisateur cherche : "${query}"

Propose 4 activités/randonnées adaptées. Pour chaque activité, réponds UNIQUEMENT en JSON valide (tableau), sans aucun texte avant ou après, sans markdown, sans backticks :

[
  {
    "emoji": "🥾",
    "title": "Nom de la rando",
    "subtitle": "Description courte en une ligne",
    "type": "rando",
    "difficulty": "facile|moyen|sportif",
    "distanceKm": 8,
    "dplus": 400,
    "durationMin": 180,
    "startTime": "08:30",
    "features": ["lac", "cascade", "faune", "vue"],
    "desc": "Description détaillée de la randonnée avec les points d'intérêt",
    "gear": ["Chaussures de rando", "Eau 1,5L", "Coupe-vent"],
    "tip": "Conseil pratique pour cette rando",
    "links": [
      {"url": "https://www.alltrails.com/fr/...", "label": "AllTrails"},
      {"url": "https://www.visorando.com/...", "label": "Visorando"}
    ]
  }
]

Sois précis sur les distances, dénivelés et durées. Les liens doivent être réels si possible.`

    try {
      const r = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        })
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // Parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Réponse invalide')
      const activities = JSON.parse(jsonMatch[0])
      setResults(activities)
    } catch (e) {
      setError('Erreur lors de la recherche. Réessayez.')
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
            placeholder="ex: rando avec lac et cascade, facile, moins de 600m D+"
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', fontSize: '.85rem', fontFamily: 'inherit', background: 'var(--bg)', outline: 'none' }}
          />
          <button className="btn btn-primary" onClick={search} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '⏳' : '🔍 Chercher'}
          </button>
        </div>

        {/* Suggestions rapides */}
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['Rando facile avec lac', 'Cascade accessible', 'Randonnée sportive vue panoramique', 'Balade famille', 'Via ferrata débutant'].map(s => (
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

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.25rem' }}
                  onClick={() => onSelectActivity({ ...act, id: undefined, notes: [], done: false })}>
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
