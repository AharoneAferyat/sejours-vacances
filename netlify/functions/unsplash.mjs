export default async function handler(req) {
  const url = new URL(req.url, 'http://localhost')
  const query = url.searchParams.get('q')
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: 'No API key' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    // Chercher plusieurs photos orientées paysage/voyage, puis en choisir une au hasard
    const searchQuery = `${query} landmark cityscape panorama skyline`
    const randomPage = Math.floor(Math.random() * 3) + 1 // pages 1-3 pour garder la pertinence

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=10&page=${randomPage}&content_filter=high&order_by=relevant`,
      { headers: { 'Authorization': `Client-ID ${key}` } }
    )
    
    if (!res.ok) throw new Error(`Unsplash ${res.status}`)
    
    const data = await res.json()
    
    if (!data.results || data.results.length === 0) {
      // Retry sans mots-clés supplémentaires
      const res2 = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&content_filter=high`,
        { headers: { 'Authorization': `Client-ID ${key}` } }
      )
      const data2 = await res2.json()
      if (!data2.results?.length) {
        return new Response(JSON.stringify({ url: null }), { headers: { 'Content-Type': 'application/json' } })
      }
      const pick = data2.results[Math.floor(Math.random() * data2.results.length)]
      return new Response(JSON.stringify({
        url: pick.urls.regular,
        thumb: pick.urls.small,
        credit: pick.user.name,
        creditUrl: pick.user.links.html,
      }), { headers: { 'Content-Type': 'application/json' } })
    }

    // Choisir une photo au hasard parmi les résultats
    const pick = data.results[Math.floor(Math.random() * data.results.length)]
    
    return new Response(JSON.stringify({
      url: pick.urls.regular,
      thumb: pick.urls.small,
      credit: pick.user.name,
      creditUrl: pick.user.links.html,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export const config = { path: '/api/unsplash' }
