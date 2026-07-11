import { useState } from 'react'

const SECTIONS = [
  { title: '🏠 Général', items: [
    { q: "C'est quoi Séjours Vacances ?", a: "Une application pour organiser tes séjours entre amis : planning d'activités, budget partagé, valise, météo, et plus. Tout le monde peut y accéder et collaborer." },
    { q: "Comment créer un séjour ?", a: "Depuis le tableau de bord, clique sur '+ Nouveau séjour'. Remplis le nom, la destination, les dates, et c'est parti ! Tu peux aussi ajouter plusieurs étapes (multi-destination)." },
    { q: "C'est quoi le multi-destination ?", a: "Un séjour peut avoir plusieurs étapes (ex: Val d'Isère → Grenoble → Annecy). Chaque étape a son propre planning, hébergement et météo. Clique sur '+ Étape' dans le bandeau du séjour pour en ajouter une." },
    { q: "Comment modifier ou supprimer un séjour ?", a: "Dans le header, clique sur l'icône ✏️ à côté du nom du séjour pour le modifier, ou l'icône 🗑 pour le supprimer." },
  ]},
  { title: '👥 Invitations & Voyageurs', items: [
    { q: "Comment inviter quelqu'un ?", a: "Depuis le tableau de bord ou l'onglet Infos, clique sur 'Inviter'. Tu peux générer un lien de partage ou un QR code. La personne devra se connecter avec Google pour rejoindre." },
    { q: "Et si je veux inviter par code ?", a: "Sur l'écran de connexion, la personne peut cliquer '🔑 Rejoindre avec un code'. Elle entre le code, puis se connecte obligatoirement avec Google." },
    { q: "Comment gérer les voyageurs ?", a: "Clique sur '👥 Voyageurs' dans la sidebar. Tu peux ajouter, supprimer des participants, et en multi-destination, assigner chaque voyageur à certaines étapes." },
    { q: "Un voyageur peut participer à une seule étape ?", a: "Oui ! En multi-destination, chaque voyageur peut être assigné à certaines étapes seulement dans la gestion des voyageurs." },
  ]},
  { title: '📋 Planning & Activités', items: [
    { q: "Comment ajouter une activité ?", a: "Dans le planning, clique sur '+ Ajouter une activité' sous le jour voulu. Remplis le titre, l'heure, la durée, la distance, le prix, etc." },
    { q: "L'IA peut proposer des activités ?", a: "Oui ! Clique sur '🤖 IA' dans la sidebar ou sur la carte IA du tableau de bord. L'IA propose des activités adaptées à ta destination. Elle ne repropose pas ce qui est déjà planifié." },
    { q: "D'où viennent les infos de l'IA ?", a: "L'IA (Gemini) utilise ses connaissances générales. La source est indiquée sous chaque suggestion. Pour les randonnées, vérifie toujours les infos sur les sites officiels (office de tourisme, topos IGN)." },
    { q: "Comment réorganiser les activités ?", a: "Tu peux glisser-déposer (drag & drop) les activités dans un jour pour changer l'ordre. Tu peux aussi déplacer une activité vers un autre jour avec le bouton '📅 Déplacer'." },
    { q: "C'est quoi 'Non fait' ?", a: "Si tu décides de ne pas faire une activité, clique '⏭ Non fait'. Elle sera barrée et exclue des statistiques (km, durée, coût) mais pas supprimée du planning." },
    { q: "Je peux ajouter un prix aux activités ?", a: "Oui ! Le champ 'Prix (€)' est dans le formulaire. Tu peux aussi cocher 'Ajouter au budget' pour créer automatiquement une dépense (commune ou perso)." },
  ]},
  { title: '💰 Budget & Dépenses', items: [
    { q: "Comment fonctionne le budget ?", a: "Définis un budget global, puis ajoute des dépenses communes (partagées) ou personnelles. Le budget a 4 onglets : Vue d'ensemble, Dépenses, Remboursements, Statistiques." },
    { q: "Comment fonctionnent les remboursements ?", a: "Façon Splitwise : le système calcule automatiquement qui doit combien à qui, en fonction des dépenses communes. Tu peux marquer un remboursement comme réglé." },
    { q: "Je peux lier une dépense à une activité ?", a: "Oui ! Quand tu ajoutes ou modifies une dépense, choisis la journée puis l'activité associée. Un badge vert apparaît sur la dépense pour voir le lien." },
    { q: "Comment modifier ou supprimer une dépense ?", a: "Clique sur le menu '⋯' sur la dépense, puis 'Modifier' ou 'Supprimer'." },
  ]},
  { title: '🧳 Valise & Sac à dos', items: [
    { q: "Quelle différence entre valise et sac ?", a: "La valise = ce que tu emportes pour tout le séjour. Le sac à dos = ce que tu prends chaque jour en rando/sortie. Les deux sont des listes à cocher partagées par voyageur." },
    { q: "Chaque voyageur a sa propre liste ?", a: "Oui ! Les onglets en haut permettent de switcher entre les voyageurs pour voir/modifier leur valise ou sac." },
  ]},
  { title: '🌤 Météo', items: [
    { q: "D'où vient la météo ?", a: "Les données proviennent d'Open-Meteo (API gratuite). C'est indicatif — pour les alertes officielles, consulte Météo France Vigilance." },
    { q: "La météo change avec les étapes ?", a: "Oui ! En multi-destination, la météo s'adapte à l'étape active (coordonnées GPS différentes)." },
  ]},
  { title: '📸 Après le séjour', items: [
    { q: "Que se passe-t-il quand le séjour est fini ?", a: "Le tableau de bord passe en mode 'Souvenirs' avec un récap des stats. Tu peux ajouter des photos par journée, clore le séjour, ou l'archiver." },
    { q: "Clore vs Archiver ?", a: "Clore = le séjour est officiellement terminé (badge 🔒). Archiver = le séjour disparaît de la liste principale et va dans les archives (dépliables en bas du dashboard). Auto-archivage après 6 mois." },
    { q: "Je peux ajouter des photos souvenirs ?", a: "Oui ! Dans la carte 'Souvenirs' du tableau de bord, clique '📷 Voir les photos'. Tu peux ajouter des photos pour chaque journée (max 2 Mo par photo)." },
  ]},
]

export default function FAQ({ onClose, inline }) {
  const [openSection, setOpenSection] = useState(0)
  const [openQ, setOpenQ] = useState(null)

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.15rem' }}>❓ Aide & FAQ</h2>
        {!inline && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}>✕</button>}
      </div>
      <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Tout ce que tu peux faire sur Séjours Vacances, en questions-réponses.
      </p>

      {SECTIONS.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: '.5rem' }}>
          <button onClick={() => setOpenSection(openSection === sIdx ? -1 : sIdx)} style={{
            width: '100%', textAlign: 'left', padding: '.6rem .75rem', border: '1px solid var(--border)',
            borderRadius: openSection === sIdx ? '10px 10px 0 0' : 10, background: openSection === sIdx ? 'var(--bg)' : 'var(--card)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 600,
            color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            {section.title}
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{openSection === sIdx ? '▼' : '▶'}</span>
          </button>
          {openSection === sIdx && (
            <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
              {section.items.map((item, qIdx) => {
                const key = `${sIdx}-${qIdx}`
                const isOpen = openQ === key
                return (
                  <div key={qIdx} style={{ borderBottom: qIdx < section.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <button onClick={() => setOpenQ(isOpen ? null : key)} style={{
                      width: '100%', textAlign: 'left', padding: '.55rem .85rem', border: 'none',
                      background: isOpen ? 'var(--green-light)' : 'transparent', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '.82rem', color: isOpen ? 'var(--green)' : 'var(--text)',
                      fontWeight: isOpen ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>{item.q}</span>
                      <span style={{ fontSize: '.7rem', flexShrink: 0, marginLeft: '.5rem' }}>{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '.5rem .85rem .65rem', fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.55, background: 'var(--card)' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </>
  )

  if (inline) return content

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh' }}>
        {content}
      </div>
    </div>
  )
}
