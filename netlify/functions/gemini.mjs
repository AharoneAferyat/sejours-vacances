const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Modèles disponibles en v1beta, du plus rapide au plus lent
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.5-flash',
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Nettoie la réponse Gemini : extrait le texte brut depuis candidates[]
function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts.map(p => p.text || '').join('')
}

// Nettoie les backticks markdown que Gemini ajoute parfois
function stripMarkdown(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
}

async function tryModel(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 22000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    })
    clearTimeout(timer)

    const raw = await res.text()
    console.log(`[${model}] status=${res.status} preview=${raw.slice(0, 150)}`)

    if (res.status === 429) return { error: 'quota', status: 429 }
    if (res.status === 503) return { error: 'overloaded', status: 503 }
    if (res.status === 404) return { error: 'not_found', status: 404 }
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status }

    // Parse la réponse Gemini et extrait le texte proprement
    let data
    try { data = JSON.parse(raw) } catch { return { error: 'invalid_json', status: 500 } }

    const text = stripMarkdown(extractText(data))
    if (!text) return { error: 'empty_response', status: 500 }

    return { ok: true, text }
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') return { error: 'timeout', status: 408 }
    return { error: e.message, status: 500 }
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' }

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

  const errors = []
  for (const model of MODELS) {
    for (const key of keys) {
      const result = await tryModel(model, key, prompt)

      if (result.ok) {
        // On retourne le texte extrait directement dans un format simple
        // Le client n'a plus à parser candidates[] lui-même
        return {
          statusCode: 200,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidates: [{ content: { parts: [{ text: result.text }] } }]
          })
        }
      }

      errors.push(`${model}: ${result.error}`)
      console.log(`Skipping ${model} (${result.error}), trying next...`)

      // 404 = modèle inexistant, inutile d'essayer les autres clés
      if (result.error === 'not_found') break
      // quota = essaie la clé suivante
      if (result.error === 'quota') continue
      // timeout/overload = passe au modèle suivant
      if (result.error === 'timeout' || result.error === 'overloaded') break

      await sleep(200)
    }
  }

  console.error('All attempts failed:', errors.join(' | '))
  const isQuota = errors.every(e => e.includes('quota'))
  const isTimeout = errors.some(e => e.includes('timeout'))
  const status = isQuota ? 429 : isTimeout ? 408 : 502

  return {
    statusCode: status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: errors[errors.length - 1], attempts: errors })
  }
}
