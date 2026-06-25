// Generate smart alerts based on day activities + weather forecast
export function generateAlerts(day, weather) {
  const alerts = []
  if (!day) return alerts

  const acts = day.activities
  const totalKm = acts.reduce((s, a) => s + (a.distanceKm || 0), 0)
  const totalDplus = acts.reduce((s, a) => s + (a.dplus || 0), 0)
  const totalMin = acts.reduce((s, a) => s + (a.durationMin || 0), 0)
  const maxAlt = totalDplus > 500 // high altitude rando
  const longDay = totalKm > 8 || totalMin > 240
  const hasRando = acts.some(a => a.type === 'rando')
  const hasLac = acts.some(a => (a.features || []).includes('lac'))

  // Weather-based alerts
  if (weather) {
    const maxTemp = Math.max(...weather.hours.map(h => h.temp))
    const hasStorm = weather.hasStorm
    const hasRain = weather.hours.some(h => h.rain > 50)
    const minTemp = Math.min(...weather.hours.filter(h => h.h >= 8 && h.h <= 18).map(h => h.temp))

    if (hasStorm) {
      alerts.push({ level: 'danger', icon: '⛈', text: 'Orages prévus demain — prévoir de rentrer avant 14h' })
    }
    if (hasRain && !hasStorm) {
      alerts.push({ level: 'warning', icon: '🌧', text: 'Pluie possible — imperméable dans le sac' })
    }
    if (maxTemp >= 28 && hasRando) {
      alerts.push({ level: 'warning', icon: '🌡', text: `Forte chaleur (${maxTemp}°C) — prévoir eau supplémentaire et partir tôt` })
    }
    if (maxTemp >= 25) {
      alerts.push({ level: 'info', icon: '☀️', text: `${maxTemp}°C demain — crème solaire et casquette indispensables` })
    }
    if (minTemp < 8 && maxAlt) {
      alerts.push({ level: 'warning', icon: '🥶', text: `Frais en altitude (${minTemp}°C min) — polaire et coupe-vent obligatoires` })
    }
    if (weather.wind > 30) {
      alerts.push({ level: 'warning', icon: '💨', text: `Vent fort (${weather.wind} km/h) — attention sur les crêtes` })
    }
  }

  // Activity-based alerts
  if (longDay && hasRando) {
    alerts.push({ level: 'info', icon: '🎒', text: `Grande journée (${totalKm}km · ${totalDplus}m D+) — vérifier le sac ce soir` })
  }
  if (totalDplus > 600) {
    alerts.push({ level: 'info', icon: '💧', text: `${totalDplus}m de dénivelé — prévoir 2L d'eau minimum par personne` })
  }
  if (hasLac && acts.some(a => a.startTime && parseInt(a.startTime) < 8)) {
    alerts.push({ level: 'info', icon: '⏰', text: 'Départ très tôt prévu — réveil à préparer ce soir' })
  }
  if (maxAlt) {
    alerts.push({ level: 'info', icon: '🏔', text: 'Altitude > 500m D+ — AllTrails hors-ligne téléchargé ?' })
  }

  // Remove duplicates by icon
  const seen = new Set()
  return alerts.filter(a => { if (seen.has(a.icon)) return false; seen.add(a.icon); return true })
}

export const ALERT_STYLES = {
  danger: { bg: '#fef2f2', border: '#ef4444', color: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
  info: { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
}
