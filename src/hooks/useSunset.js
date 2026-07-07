import { useState, useEffect } from 'react'

// Sunrise-sunset API - free, no key
export function useSunriseSunset(lat, lon) {
  const [sunset, setSunset] = useState(null) // local hour of sunset

  useEffect(() => {
    if (!lat || !lon) return
    const today = new Date().toISOString().split('T')[0]
    fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${today}&formatted=0`)
      .then(r => r.json())
      .then(data => {
        if (data.results?.sunset) {
          const h = new Date(data.results.sunset).getHours()
          setSunset(h)
        }
      })
      .catch(() => setSunset(19)) // fallback
  }, [lat, lon])

  return sunset
}
