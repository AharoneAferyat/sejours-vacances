// Models tried in order - fallback if quota exceeded or unavailable
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
]

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Method Not Allowed' }
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' })
    }
  }

  let { prompt } = JSON.parse(event.body || '{}')
  if (!prompt) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing prompt' }) }
  }

  let lastError = null

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      })

      const text = await response.text()

      // Skip to next model on quota/unavailable errors
      if (response.status === 429 || response.status === 503) {
        console.log(`${model} unavailable (${response.status}), trying next...`)
        lastError = { status: response.status, model, text: text.slice(0, 200) }
        continue
      }

      if (!response.ok) {
        lastError = { status: response.status, model, text: text.slice(0, 200) }
        continue
      }

      console.log(`Success with model: ${model}`)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Model-Used': model },
        body: text
      }
    } catch (e) {
      console.log(`${model} fetch error: ${e.message}`)
      lastError = { status: 500, model, text: e.message }
      continue
    }
  }

  // All models failed
  return {
    statusCode: 503,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Tous les modèles sont indisponibles. Réessaie dans quelques minutes.', details: lastError })
  }
}
