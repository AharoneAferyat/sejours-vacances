const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Modèles du plus rapide au plus lent
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function tryModel(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  // Timeout interne à 20s (Netlify coupe à 26s)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      })
    })
    clearTimeout(timer)

    const text = await res.text()
    console.log(`[${model}] status=${res.status} preview=${text.slice(0, 120)}`)

    if (res.status === 429) return { error: 'quota', status: 429 }
    if (res.status === 503) return { error: 'overloaded', status: 503 }
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status }

    return { ok: true, text }
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') return { error: 'timeout', status: 408 }
    return { error: e.message, status: 500 }
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' }
  }

  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean)

  if (keys.length === 0) {
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No GEMINI_API_KEY configured' }) }
  }

  let prompt
  try { ({ prompt } = JSON.parse(event.body || '{}')) } catch {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }
  if (!prompt) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing prompt' }) }
  }

  // Essaie chaque modèle avec chaque clé, du plus rapide au plus lent
  const errors = []
  for (const model of MODELS) {
    for (const key of keys) {
      const result = await tryModel(model, key, prompt)
      if (result.ok) {
        // Retourne la réponse brute de Gemini (le client parse déjà candidates[])
        try {
          const parsed = JSON.parse(result.text)
          return {
            statusCode: 200,
            headers: { ...CORS, 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }
        } catch {
          return {
            statusCode: 200,
            headers: { ...CORS, 'Content-Type': 'application/json' },
            body: result.text
          }
        }
      }

      errors.push(`${model}/${key.slice(-4)}: ${result.error}`)

      // Si quota épuisé sur cette clé, passe à la suivante
      if (result.error === 'quota') continue
      // Si timeout ou overload, essaie le modèle suivant (pas d'attente)
      if (result.error === 'timeout' || result.error === 'overloaded') break
      // Petite pause entre tentatives
      await sleep(300)
    }
  }

  console.error('All attempts failed:', errors.join(' | '))
  const lastError = errors[errors.length - 1] || 'unknown'
  const status = lastError.includes('quota') ? 429 : lastError.includes('timeout') ? 408 : 502
  return {
    statusCode: status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: lastError, attempts: errors })
  }
}
