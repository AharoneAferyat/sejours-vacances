import { useState } from 'react'

const IDEES = [
  { emoji: '🏔️', titre: 'Randonnée en montagne', desc: 'Alpes, Pyrénées, Vosges... Planifie chaque étape, la météo, le matériel.', tag: 'Nature' },
  { emoji: '🌊', titre: 'Séjour en bord de mer', desc: 'Bretagne, Côte d\'Azur, Corse... Activités nautiques, balades côtières.', tag: 'Détente' },
  { emoji: '🏙️', titre: 'City break', desc: 'Paris, Lyon, Barcelone... Musées, restos, quartiers à explorer.', tag: 'Culture' },
  { emoji: '🌲', titre: 'Week-end forêt', desc: 'Fontainebleau, Ardennes... Randos, escalade, reconnexion avec la nature.', tag: 'Nature' },
  { emoji: '🚴', titre: 'Tour à vélo', desc: 'Loire à vélo, Tour du Mont Blanc... Étapes, hébergements, logistique.', tag: 'Sport' },
  { emoji: '❄️', titre: 'Séjour ski', desc: 'Chamonix, Val d\'Isère, Les Arcs... Pistes, remontées, météo montagne.', tag: 'Hiver' },
]

const ETAPES = [
  { icon: '📅', titre: 'Crée ton séjour', desc: 'Donne un nom, des dates et une destination. L\'app génère automatiquement ton planning jour par jour.' },
  { icon: '🤖', titre: 'Laisse l\'IA suggérer', desc: 'IA Activités propose des randos, visites et activités adaptées à ta destination et tes préférences.' },
  { icon: '👥', titre: 'Invite tes compagnons', desc: 'Partage le séjour avec tes amis ou ta famille. Chacun voit le programme en temps réel.' },
  { icon: '🧳', titre: 'Prépare tes affaires', desc: 'Valise et sac à dos intelligents : coche ce que tu as préparé, ne rien oublier.' },
]

export default function EmptyState({ onCreateTrip, userName }) {
  const [activeIdee, setActiveIdee] = useState(null)

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '.75rem' }}>🥾</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 700, color: 'var(--text)', marginBottom: '.6rem' }}>
          {userName ? `Bienvenue, ${userName} !` : 'Bienvenue sur Séjours Vacances !'}
        </h1>
        <p style={{ fontSize: '.95rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 1.75rem' }}>
          Planifie tes randonnées et séjours de A à Z — météo, activités, budget, valise. Tout au même endroit.
        </p>
        <button onClick={onCreateTrip} style={{
          background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 14,
          padding: '.85rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(47,143,107,.35)',
          transition: 'all .2s', display: 'inline-flex', alignItems: 'center', gap: '.5rem'
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ＋ Créer mon premier séjour
        </button>
      </div>

      {/* Comment ça marche */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Comment ça marche
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.75rem' }}>
          {ETAPES.map((e, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>{e.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '.3rem', color: 'var(--text)' }}>{e.titre}</div>
              <div style={{ fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{e.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Idées de séjours */}
      <div>
        <h2 style={{ fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Quelques idées pour commencer
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.65rem' }}>
          {IDEES.map((idee, i) => (
            <div key={i}
              onClick={() => setActiveIdee(activeIdee === i ? null : i)}
              style={{
                background: activeIdee === i ? 'var(--green-light)' : 'var(--card)',
                border: `1px solid ${activeIdee === i ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 12, padding: '.85rem', cursor: 'pointer',
                transition: 'all .15s', boxShadow: 'var(--shadow-sm)'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{idee.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)' }}>{idee.titre}</span>
              </div>
              {activeIdee === i && (
                <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '.65rem' }}>{idee.desc}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.65rem', fontWeight: 500, color: 'var(--green)', background: 'var(--green-light)', padding: '2px 8px', borderRadius: 20 }}>{idee.tag}</span>
                {activeIdee === i && (
                  <button onClick={e => { e.stopPropagation(); onCreateTrip() }}
                    style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Créer ce séjour →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
