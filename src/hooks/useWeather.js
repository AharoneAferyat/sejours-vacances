import { useState, useEffect } from 'react'

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',61:'🌧',63:'🌧',65:'🌧',80:'🌦',81:'🌧',82:'⛈',95:'⛈',96:'⛈',99:'⛈' }
const WC_LBL = { 0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',45:'Brouillard',51:'Bruine légère',61:'Pluie légère',63:'Pluie',80:'Averses',95:'Orage' }

export async function geocodeAddress(address) {
  if (!address) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const r = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const data = await r.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name }
  } catch {}
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
      rain: hourlyData.precipitation_probability?.[i] || 0,
      wind: Math.round(hourlyData.windspeed_10m?.[i] || 0),
      isNow: dayIdx === 0 && dt.getHours() === nowH,
      dayOffset: dayIdx,
    }
  }).filter(x => x.dayOffset === dayOffset)
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
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,apparent_temperature,relative_humidity_2m&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=2`
        const r = await fetch(url)
        const d = await r.json()
        if (cancelled) return
        const todayHours = parseHours(d.hourly, 0)
        const tomorrowHours = parseHours(d.hourly, 1)
        const wc = d.current.weathercode
        const fmtTime = (iso) => { if (!iso) return '--:--'; const dt = new Date(iso); return dt.getHours().toString().padStart(2,'0')+':'+dt.getMinutes().toString().padStart(2,'0') }

        const mkWeather = (hours, dayIdx = 0) => ({
          temp: Math.round(d.current.temperature_2m),
          wind: Math.round(d.current.windspeed_10m),
          wc, icon: WC_ICON[wc] || '🌡', label: WC_LBL[wc] || '',
          feelsLike: Math.round(d.current.apparent_temperature || d.current.temperature_2m),
          humidity: d.current.relative_humidity_2m || 0,
          tempMax: Math.round(d.daily?.temperature_2m_max?.[dayIdx] || 0),
          tempMin: Math.round(d.daily?.temperature_2m_min?.[dayIdx] || 0),
          uvMax: Math.round(d.daily?.uv_index_max?.[dayIdx] || 0),
          rainProb: d.daily?.precipitation_probability_max?.[dayIdx] || 0,
          sunrise: fmtTime(d.daily?.sunrise?.[dayIdx]),
          sunset: fmtTime(d.daily?.sunset?.[dayIdx]),
          hasStorm: hours.some(h => [95,96,99,80,81,82].includes(h.wc) && h.h >= 12),
          hours,
        })
        setWeather(mkWeather(todayHours, 0))
        const midDay = tomorrowHours.find(h => h.h === 12) || tomorrowHours[3] || tomorrowHours[0]
        const tomorrowWc = midDay?.wc || 0
        setTomorrow({
          ...mkWeather(tomorrowHours, 1),
          temp: tomorrowHours.length ? Math.round(Math.max(...tomorrowHours.map(h => h.temp))) : 0,
          wc: tomorrowWc, icon: WC_ICON[tomorrowWc] || '🌡', label: WC_LBL[tomorrowWc] || '',
        })
      } catch {
        if (!cancelled) { setWeather(null); setTomorrow(null) }
      } finally { if (!cancelled) setLoading(false) }
    }
    fetchWeather()
    const id = setInterval(fetchWeather, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [lat, lon])
  return { weather, tomorrow, loading }
}
