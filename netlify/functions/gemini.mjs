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

  // Try gemini-1.5-flash first, fallback model
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

  try {
    const { prompt } = JSON.parse(event.body)
    if (!prompt) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing prompt' }) }
    }

    const response = await fetch(GEMINI_URL, {
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

    if (!response.ok) {
      console.error('Gemini error:', response.status, text)
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Gemini error ${response.status}`, details: text.slice(0, 500) })
      }
    }

    // Log structure for debugging
    try {
      const parsed = JSON.parse(text)
      const parts = parsed?.candidates?.[0]?.content?.parts || []
      console.log('Parts count:', parts.length)
      parts.forEach((p, i) => {
        console.log(`Part ${i} thought:`, p.thought, 'text preview:', (p.text||'').slice(0, 100))
      })
    } catch(e) {}

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: text
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    }
  }
}
