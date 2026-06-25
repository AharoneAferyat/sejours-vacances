import { useState, useEffect } from 'react'

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',61:'🌧',63:'🌧',65:'🌧',80:'🌦',81:'🌧',82:'⛈',95:'⛈',96:'⛈',99:'⛈' }
const WC_LBL = { 0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',45:'Brouillard',51:'Bruine légère',61:'Pluie légère',63:'Pluie',80:'Averses',95:'Orage' }

// Geocode an address to lat/lon using Nominatim (OpenStreetMap, free, no key)
export async function geocodeAddress(address) {
  if (!address) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const r = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const data = await r.json()
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name }
    }
  } catch (e) {}
  return null
}

function parseHours(hourlyData, dayOffset = 0) {
  const nowH = new Date().getHours()
  return hourlyData.time.map((t, i) => {
    const dt = new Date(t)
    const dayIdx = Math.floor(i / 24)
    return {
      h: dt.getHours(),
      temp: Math.round(hourlyData.temperature_2m[i]),
      wc: hourlyData.weathercode[i],
      rain: hourlyData.precipitation_probability[i],
      isNow: dayIdx === 0 && dt.getHours() === nowH,
      dayOffset: dayIdx,
    }
  }).filter(x => x.dayOffset === dayOffset && x.h >= 6 && x.h <= 20)
}

export function useWeather(lat, lon) {
  const [weather, setWeather] = useState(null)
  const [tomorrow, setTomorrow] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lat || !lon) { setLoading(false); return }
    let cancelled = false

    async function fetchWeather() {
      setLoading(true)
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,weathercode,precipitation_probability&timezone=auto&forecast_days=2`
        const r = await fetch(url)
        const d = await r.json()
        if (cancelled) return

        const todayHours = parseHours(d.hourly, 0)
        const tomorrowHours = parseHours(d.hourly, 1)

        const wc = d.current.weathercode
        const mkWeather = (hours) => ({
          temp: Math.round(d.current.temperature_2m),
          wind: Math.round(d.current.windspeed_10m),
          wc, icon: WC_ICON[wc] || '🌡', label: WC_LBL[wc] || '',
          hasStorm: hours.some(h => [95,96,99,80,81,82].includes(h.wc) && h.h >= 12),
          hours,
        })

        setWeather(mkWeather(todayHours))
        setTomorrow({
          ...mkWeather(tomorrowHours),
          temp: tomorrowHours.length ? Math.round(tomorrowHours.reduce((s,h) => s+h.temp,0)/tomorrowHours.length) : 0,
          wc: tomorrowHours[6]?.wc || 0,
          icon: WC_ICON[tomorrowHours[6]?.wc || 0] || '🌡',
          label: WC_LBL[tomorrowHours[6]?.wc || 0] || '',
          hasStorm: tomorrowHours.some(h => [95,96,99,80,81,82].includes(h.wc)),
          wind: Math.round(tomorrowHours.reduce((s,h) => s+h.rain,0)/tomorrowHours.length || 0),
          hours: tomorrowHours,
        })
      } catch (e) {
        if (!cancelled) { setWeather(null); setTomorrow(null) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchWeather()
    const id = setInterval(fetchWeather, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [lat, lon])

  return { weather, tomorrow, loading }
}
