const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODELS = [
  { model: 'gemini-2.0-flash-lite', api: 'v1beta' },
  { model: 'gemini-2.0-flash',      api: 'v1beta' },
  { model: 'gemini-2.5-flash',      api: 'v1beta' },
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function extractAndParseJSON(raw) {
  // Extrait le texte de la réponse Gemini
  let data
  try { data = JSON.parse(raw) } catch { return null }
  const parts = data?.candidates?.[0]?.content?.parts || []
  let text = parts.map(p => p.text || '').join('').trim()
  
  // Nettoie les backticks markdown
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  
  // Trouve le début du JSON
  const arrStart = text.indexOf('[')
  const objStart = text.indexOf('{')
  let start = -1
  if (arrStart === -1) start = objStart
  else if (objStart === -1) start = arrStart
  else start = Math.min(arrStart, objStart)
  if (start === -1) return null
  
  text = text.slice(start)
  
  // Trouve la fin en comptant les brackets
  let depth = 0, end = -1, inStr = false, esc = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end !== -1) text = text.slice(0, end + 1)
  
  // Fixe virgules trailing
  text = text.replace(/,\s*([}\]])/g, '$1')
  
  try {
    const result = JSON.parse(text)
    return Array.isArray(result) ? result : [result]
  } catch { return null }
}

async function tryModel(model, api, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`
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
    console.log(`[${model}] status=${res.status} len=${raw.length}`)

    if (res.status === 429) return { error: 'quota' }
    if (res.status === 503) return { error: 'overloaded' }
    if (res.status === 404) return { error: 'not_found' }
    if (!res.ok) return { error: `HTTP ${res.status}` }

    const parsed = extractAndParseJSON(raw)
    if (!parsed || parsed.length === 0) {
      console.log(`[${model}] parse failed, raw preview: ${raw.slice(0, 200)}`)
      return { error: 'parse_failed' }
    }
    console.log(`[${model}] OK - ${parsed.length} items`)
    return { ok: true, parsed }
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') return { error: 'timeout' }
    return { error: e.message }
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

  if (!keys.length) return {
    statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'No API key configured' })
  }

  let prompt
  try { ({ prompt } = JSON.parse(event.body || '{}')) } catch {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid body' }) }
  }
  if (!prompt) return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing prompt' }) }

  const errors = []
  for (const { model, api } of MODELS) {
    for (const key of keys) {
      const result = await tryModel(model, api, key, prompt)
      if (result.ok) {
        // Renvoie le tableau JSON parsé directement — plus rien à parser côté client
        return {
          statusCode: 200,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, data: result.parsed })
        }
      }
      errors.push(`${model}: ${result.error}`)
      if (result.error === 'not_found') break
      if (result.error === 'quota') continue
      if (['timeout', 'overloaded', 'parse_failed'].includes(result.error)) break
      await sleep(200)
    }
  }

  return {
    statusCode: 502,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: errors[errors.length - 1], attempts: errors })
  }
}
