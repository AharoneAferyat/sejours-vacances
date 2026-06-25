import { db, auth } from './firebase'
import { doc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const vid = 'v_aharone'

function waitForAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(user)
    })
  })
}

export async function seedDatabase() {
  const user = await waitForAuth()
  if (!user) {
    console.error('Non connecté ! Connecte-toi avec Google d\'abord.')
    return
  }
  const uid = user.uid
  console.log('Connecté en tant que:', user.email, '/ UID:', uid)

  const data = {
    trips: [{
      id: 'trip_valdisere_2026',
      name: "Val d'Isère",
      subtitle: 'Lacs & Cascades',
      destination: "Val d'Isère",
      accommodation: "116 Avenue Olympique, 73150 Val d'Isère",
      accommodationPhone: '04 79 06 19 65',
      startDate: '2026-07-05',
      endDate: '2026-07-10',
      color: '#0F6E56',
      lat: 45.4481,
      lon: 6.9803,
      voyageurs: [{ id: vid, name: 'Aharone' }],
      activeVoyageurId: vid,
      voyageurData: {
        [vid]: {
          valise: [
            { id: 'v0', text: "Carte d'identité / passeport", done: false },
            { id: 'v1', text: 'Billet train (app SNCF)', done: false },
            { id: 'v2', text: 'Billet Altibus (BSG6411704)', done: false },
            { id: 'v3', text: 'Téléphone + chargeur', done: false },
            { id: 'v4', text: 'Batterie externe', done: false },
            { id: 'v5', text: 'Écouteurs', done: false },
            { id: 'v6', text: 'Vêtements (4 jours)', done: false },
            { id: 'v7', text: 'Sous-vêtements + chaussettes', done: false },
            { id: 'v8', text: 'Pyjama', done: false },
            { id: 'v9', text: 'Trousse de toilette', done: false },
            { id: 'v10', text: 'Médicaments', done: false },
            { id: 'v11', text: 'Serviette', done: false },
            { id: 'v12', text: 'Carte bancaire + espèces', done: false },
          ],
          sac: [
            { id: 's0', text: 'Chaussures de rando (semelle Vibram)', done: false },
            { id: 's1', text: 'Bâtons de marche', done: false },
            { id: 's2', text: 'Eau 2L / personne', done: false },
            { id: 's3', text: 'Coupe-vent imperméable', done: false },
            { id: 's4', text: 'Crème solaire SPF 50+', done: false },
            { id: 's5', text: 'Lunettes catégorie 3 ou 4', done: false },
            { id: 's6', text: 'Casquette', done: false },
            { id: 's7', text: 'Barres / noix / fruits secs', done: false },
            { id: 's8', text: 'Pique-nique', done: false },
            { id: 's9', text: 'Mini pharmacie', done: false },
            { id: 's10', text: 'Polaire légère', done: false },
            { id: 's11', text: 'AllTrails hors-ligne téléchargé', done: false },
            { id: 's12', text: 'Appareil photo', done: false },
          ]
        }
      },
      days: [
        {
          id: 'day_20260705', date: '2026-07-05', label: 'Dim 5 juil',
          type: 'voyage', validated: false,
          activities: [{
            id: 'act_aller', emoji: '🚄', title: "Paris → Val d'Isère",
            type: 'voyage', difficulty: 'repos',
            subtitle: 'TGV + TER + Altibus · Arrivée ~16h45',
            startTime: '07:52', endTime: '16:45',
            distanceKm: 800, durationMin: 535, dplus: 0, features: [],
            desc: "<strong>🚄 07h52</strong> Paris Gare de Lyon → Chambéry 12h15 · Voiture 5 · Siège 503 (pont bas)<br><br><strong>🚌 13h53</strong> Chambéry → Bourg-Saint-Maurice 15h45 (TER 883164 + autocar 410224, correspondance Albertville 10 min)<br><br><strong>🚌 Altibus 16h00</strong> BSM → Val d'Isère 16h45 · Réf : BSG6411704",
            gear: ["Bagage / sac à dos", "Téléphone chargé", "Snacks", "Billet Altibus (BSG6411704)"],
            links: [{ url: 'https://www.altibus.com', label: 'Altibus' }],
            tip: "⚠️ Travaux signalés à Bourgoin-Jallieu.",
            notes: [], done: false
          }]
        },
        {
          id: 'day_20260706', date: '2026-07-06', label: 'Lun 6 juil',
          type: 'rando', validated: false,
          activities: [{
            id: 'act_fornet', emoji: '🌊', title: 'Cascade du Fornet',
            type: 'rando', difficulty: 'facile',
            subtitle: "Forêt de mélèzes · chute d'eau · acclimation parfaite",
            startTime: '08:30', endTime: '13:00',
            distanceKm: 5, durationMin: 150, dplus: 220, features: ['cascade'],
            desc: "Bus rouge gratuit depuis le village (~15 min). Suivre le chemin en rive gauche de l'Isère jusqu'au pont des Cognons, puis vers la <strong>cascade du Fornet</strong>.",
            gear: ['Chaussures de rando', 'Bâtons recommandés', 'Eau 1L'],
            links: [{ url: 'https://www.alltrails.com/fr/randonnee/france/savoie/cascade-du-fornet', label: 'AllTrails — Cascade du Fornet' }],
            tip: "Départ 8h30. Retour déjeuner.",
            notes: [], done: false
          }]
        },
        {
          id: 'day_20260707', date: '2026-07-07', label: 'Mar 7 juil',
          type: 'rando', validated: false,
          activities: [{
            id: 'act_ouillette', emoji: '🏞', title: "Lac de l'Ouillette — à pied depuis le village",
            type: 'rando', difficulty: 'moyen',
            subtitle: 'Lac turquoise 2350m · 700m D+ · montée intégrale à pied',
            startTime: '07:30', endTime: '14:00',
            distanceKm: 10, durationMin: 390, dplus: 700, features: ['lac', 'faune', 'vue'],
            desc: "<strong>Montée intégrale à pied !</strong> Sentier Solaise depuis le camp. 1h30–2h de montée.<br><br>Au sommet : <strong>lac de l'Ouillette</strong> aux reflets turquoise · marmottes · Restaurant La Plage (10h–17h).",
            gear: ['Chaussures de rando avec maintien', 'Bâtons fortement recommandés', 'Eau 1,5–2L', 'Coupe-vent', 'Crème solaire SPF 50+', 'Pique-nique'],
            links: [{ url: 'https://www.alltrails.com/fr/randonnee/france/savoie/val-d-isere-lac-de-l-ouillette', label: "AllTrails — Lac de l'Ouillette" }],
            tip: "Départ avant 8h.",
            notes: [], done: false
          }]
        },
        {
          id: 'day_20260708', date: '2026-07-08', label: 'Mer 8 juil',
          type: 'rando', validated: false,
          activities: [{
            id: 'act_salin', emoji: '💧', title: 'Cascades de Salin + Gouille de Salin + Lac du Chevril',
            type: 'rando', difficulty: 'moyen',
            subtitle: 'Bois de Laye · résurgence mystérieuse · barrage le plus haut de France',
            startTime: '08:30', endTime: '13:30',
            distanceKm: 9.5, durationMin: 180, dplus: 350, features: ['cascade', 'lac', 'vue'],
            desc: "Depuis La Daille (bus rouge), sentier dans le <strong>Bois de Laye</strong>.<br><br>• <strong>Gouille de Salin</strong> — eau du glacier qui ressort du sol<br>• <strong>Cascades de Salin</strong> — chutes imposantes<br>• Vue sur le <strong>lac du Chevril</strong> (barrage 160m)",
            gear: ['Chaussures de rando', 'Eau 1,5L', 'Coupe-vent'],
            links: [{ url: 'https://www.alltrails.com/fr/randonnee/france/savoie/la-daille-bois-de-laye-lac-du-chevril', label: 'AllTrails — Bois de Laye' }],
            tip: "Départ 8h30.",
            notes: [], done: false
          }]
        },
        {
          id: 'day_20260709', date: '2026-07-09', label: 'Jeu 9 juil',
          type: 'rando', validated: false,
          activities: [{
            id: 'act_montroup', emoji: '🌸', title: 'Tour du Mont Roup + Cascades du Saut du Pisset',
            type: 'rando', difficulty: 'moyen',
            subtitle: 'Boucle Vanoise · double cascade remarquable · 4,9⭐ AllTrails',
            startTime: '08:15', endTime: '14:00',
            distanceKm: 12, durationMin: 330, dplus: 625, features: ['cascade', 'faune', 'vue'],
            desc: "<strong>La rando coup de cœur — 4,9/5 AllTrails.</strong><br><br>Sens <strong>anti-horaire (par les Pissets)</strong>.<br>• <strong>Cascade du Saut du Pisset</strong> — double écoulement<br>• <strong>Lac du Grapillon</strong> (2665m)<br>• Marmottes + Vue Mont Blanc",
            gear: ['Chaussures de rando semelle crantée', 'Bâtons', 'Eau 2L', 'Pique-nique', 'Coupe-vent (2600m+)', 'Crème solaire SPF 50+'],
            links: [
              { url: 'https://www.visorando.com/randonnee-tour-du-mont-roup/', label: 'Visorando — Tour du Mont Roup' },
              { url: 'https://www.alltrails.com/fr/randonnee/france/savoie/tour-du-mont-roup', label: 'AllTrails — Tour du Mont Roup' }
            ],
            tip: "Départ 8h15. Ce soir : bagages prêts !",
            notes: [], done: false
          }]
        },
        {
          id: 'day_20260710', date: '2026-07-10', label: 'Ven 10 juil',
          type: 'voyage', validated: false,
          activities: [{
            id: 'act_retour', emoji: '🚄', title: "Val d'Isère → Paris",
            type: 'voyage', difficulty: 'repos',
            subtitle: 'Altibus 09h00 · TER + TGV · Arrivée Paris 16h16',
            startTime: '09:00', endTime: '16:16',
            distanceKm: 800, durationMin: 436, dplus: 0, features: [],
            desc: "<strong>🚌 Altibus 09h00</strong> Val d'Isère → BSM 09h40 · Réf BSG6411704<br><br><strong>🚄 10h13</strong> BSM → Albertville · <strong>11h25</strong> → Chambéry 12h57<br><br><strong>🚄 13h23</strong> TGV 6972 → Paris <strong>16h16</strong> · Voiture 8 · Siège 827 (fenêtre)",
            gear: ['Bagages prêts la veille', 'Billet Altibus (BSG6411704)', 'Snacks'],
            links: [{ url: 'https://www.altibus.com', label: 'Altibus' }],
            tip: "⚠️ Se présenter Gare Routière avant 08h45.",
            notes: [], done: false
          }]
        },
      ],
      infoBlocks: [
        {
          id: 'info_hebergement', icon: '🏕', title: 'Hébergement',
          content: "Camp Cévéo\n116 Avenue Olympique, 73150 Val d'Isère\nTél : 04 79 06 19 65\nDossier : C26-47259\n\nPension complète · Linge inclus · Ménage inclus\nAssurance Mutuaide : 01 55 98 71 84\nSinistre : https://sinistre.assurinco.com"
        },
        {
          id: 'info_urgences', icon: '📞', title: 'Urgences & Contacts',
          content: "Urgences : 15 ou 112\nPGHM Savoie : +33 4 79 08 30 44\nAltibus urgences : +33 4 79 07 04 49\nMutuaide 24h/7j : 01 55 98 71 84\n\nMétéo live : https://www.valdisere.com/live/meteo-a-val-disere/"
        },
        {
          id: 'info_aller', icon: '🚄', title: 'Trajet aller — Dim 5 juillet',
          content: "**07h52** Paris Gare de Lyon → **12h15** Chambéry\nVoiture 5 · Siège 503 (pont bas)\n\n**13h53** Chambéry → **15h45** Bourg-Saint-Maurice\nTER 883164 · Correspondance Albertville 10 min\n\n**Altibus 16h00** BSM → Val d'Isère **16h45**\nRéf : BSG6411704 · Se présenter avant 15h45\n\nhttps://www.altibus.com"
        },
        {
          id: 'info_retour', icon: '🚄', title: 'Trajet retour — Ven 10 juillet',
          content: "**Altibus 09h00** Val d'Isère → BSM 09h40\nRéf : BSG6411704 · ⚠️ Se présenter avant 08h45\n\n**10h13** BSM → Albertville · **11h25** → Chambéry **12h57**\n\n**13h23** TGV 6972 → Paris **16h16**\nVoiture 8 · Siège 827 (fenêtre)\n\nhttps://www.altibus.com"
        },
        {
          id: 'info_navettes', icon: '🚌', title: "Navettes gratuites Val d'Isère",
          content: "**Bus Jaune** — Village ↔ Le Manchet\n**Bus Rouge** — Village ↔ La Daille ↔ Le Fornet\n\nGratuits · Fréquents en saison\nhttps://www.valdisere.com/pratique/transports/"
        },
        {
          id: 'info_apps', icon: '🗺', title: 'Apps recommandées',
          content: "**AllTrails** — GPS + cartes hors-ligne (télécharger tracés AVANT de partir)\n**IGN Rando** — carte 3633ET Tignes/Val d'Isère\n**Météo-France** — prévisions heure par heure"
        },
        {
          id: 'info_regles', icon: '⚠️', title: 'Règles sécurité montagne',
          content: "Partir avant 9h00\nRentrer avant 14h si le ciel se couvre\nOrages typiques 14h–18h en été\n\nNe jamais partir seul sans dire où on va\nTéléphone chargé obligatoire\nEau minimum 1,5L / personne / journée"
        },
      ]
    }],
    activeTripId: 'trip_valdisere_2026',
    notes: [],
    updatedAt: Date.now()
  }

  await setDoc(doc(db, 'users', uid), data)
  console.log("✅ Données Val d'Isère chargées dans Firebase !")
  console.log('UID:', uid)
  return data
}
