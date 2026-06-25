// ─── VALISE & SAC DEFAULTS ───────────────────────────────────────────────────
export const VALISE0 = [
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
]

export const SAC0 = [
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

// ─── ACTIVITY TYPES ───────────────────────────────────────────────────────────
export const ACTIVITY_TYPES = [
  { id: 'rando', label: 'Randonnée', emoji: '🥾' },
  { id: 'voyage', label: 'Voyage / Transport', emoji: '🚄' },
  { id: 'lac', label: 'Lac', emoji: '🏞' },
  { id: 'cascade', label: 'Cascade', emoji: '🌊' },
  { id: 'repas', label: 'Repas', emoji: '🍽' },
  { id: 'visite', label: 'Visite', emoji: '🗺' },
  { id: 'sport', label: 'Sport / Activité', emoji: '⛷' },
  { id: 'repos', label: 'Repos', emoji: '😴' },
  { id: 'autre', label: 'Autre', emoji: '📌' },
]

export const DIFFICULTY = [
  { id: 'facile', label: 'Facile', color: '#E1F5EE', textColor: '#0F6E56' },
  { id: 'moyen', label: 'Intermédiaire', color: '#FAEEDA', textColor: '#BA7517' },
  { id: 'sportif', label: 'Sportif', color: '#FCEBEB', textColor: '#A32D2D' },
  { id: 'repos', label: 'Repos', color: '#E6F1FB', textColor: '#185FA5' },
]

// ─── EMOJIS ───────────────────────────────────────────────────────────────────
export const EMOJIS = [
  '🥾','💧','🏔','🌊','🏞','🦌','🌸','😴','🚄','🗺',
  '🍽','⛷','🏊','🚌','🎒','📸','🌅','🏕','🦅','🌿',
  '⛰','🏰','🛶','🚵','🧗','🌺','🦋','🐻','🦔','🌙',
]

// ─── DEFAULT TRIP (Val d'Isère) ───────────────────────────────────────────────
export const VAL_DISERE_TRIP = {
  id: 'trip_valdisere_2026',
  name: "Val d'Isère",
  subtitle: 'Lacs & Cascades',
  destination: "Val d'Isère",
  accommodation: '116 Avenue Olympique, 73150 Val d\'Isère',
  accommodationPhone: '04 79 06 19 65',
  startDate: '2026-07-05', // arrivée
  endDate: '2026-07-10',   // départ
  color: '#0F6E56',
  days: [
    {
      id: 'day_0', date: '2026-07-05', label: 'Dim 5 juil', type: 'voyage',
      validated: false, activities: [
        {
          id: 'act_voyage_aller', emoji: '🚄', title: "Paris → Val d'Isère",
          type: 'voyage', difficulty: 'repos',
          subtitle: 'TGV + TER + Altibus · Arrivée ~16h45',
          startTime: '07:52', endTime: '16:45',
          distanceKm: 800, durationMin: 535,
          features: [],
          desc: "<strong>🚄 07h52</strong> Paris Gare de Lyon → Chambéry 12h15 · Voiture 5 · Siège 503 (pont bas)<br><br><strong>🚌 13h53</strong> Chambéry → Bourg-Saint-Maurice 15h45 (TER 883164 + autocar 410224, correspondance Albertville 10 min)<br><br><strong>🚌 Altibus 16h00</strong> BSM Gare routière → Val d'Isère 16h45 · Réf : BSG6411704",
          gear: ["Bagage / sac à dos", "Téléphone chargé", "Snacks pour le trajet", "Billet Altibus (BSG6411704)"],
          links: [{ url: 'https://www.altibus.com', label: 'Altibus — modifier/annuler' }],
          tip: '⚠️ Travaux signalés à Bourgoin-Jallieu sur le trajet Paris → Chambéry.',
          notes: [], done: false,
        }
      ]
    },
    {
      id: 'day_1', date: '2026-07-06', label: 'Lun 6 juil', type: 'rando',
      validated: false, activities: [
        {
          id: 'act_fornet', emoji: '🌊', title: 'Cascade du Fornet',
          type: 'rando', difficulty: 'facile',
          subtitle: "Forêt de mélèzes · chute d'eau · acclimation parfaite",
          startTime: '08:30', endTime: '13:00',
          distanceKm: 5, durationMin: 150,
          features: ['cascade'],
          desc: "Bus rouge gratuit depuis le village (~15 min). Suivre le chemin en rive gauche de l'Isère jusqu'au pont des Cognons, puis vers la <strong>cascade du Fornet</strong> — chute d'eau en forêt de mélèzes.",
          gear: ['Chaussures de rando (terrain glissant)', 'Bâtons recommandés', 'Eau 1L'],
          links: [
            { url: 'https://www.alltrails.com/fr/randonnee/france/savoie/cascade-du-fornet', label: 'AllTrails — Cascade du Fornet' },
            { url: 'https://www.valdisere.com/offres/boucle-du-fornet-par-la-cascade-du-fornet-val-disere-fr-4215954/', label: "Fiche OT Val d'Isère" },
          ],
          tip: "Départ 8h30. Retour déjeuner. Après-midi libre — Centre Aquasportif option.",
          notes: [], done: false,
          dplus: 220,
        }
      ]
    },
    {
      id: 'day_2', date: '2026-07-07', label: 'Mar 7 juil', type: 'rando',
      validated: false, activities: [
        {
          id: 'act_ouillette', emoji: '🏞', title: "Lac de l'Ouillette — à pied depuis le village",
          type: 'rando', difficulty: 'moyen',
          subtitle: 'Lac turquoise 2350m · 700m D+ · montée intégrale à pied',
          startTime: '07:30', endTime: '14:00',
          distanceKm: 10, durationMin: 390,
          features: ['lac', 'faune', 'vue'],
          desc: "<strong>Montée intégrale à pied !</strong> Depuis le camp, sentier Solaise. Montée en forêt de mélèzes — 1h30–2h selon ton rythme.<br><br>Au sommet : <strong>lac de l'Ouillette</strong> aux reflets turquoise · marmottes · Restaurant La Plage (10h–17h).",
          gear: ['Chaussures de rando avec maintien cheville', 'Bâtons fortement recommandés (700m D+)', 'Eau 1,5–2L', 'Coupe-vent obligatoire (2350m)', 'Crème solaire SPF 50+', 'Pique-nique complet'],
          links: [
            { url: 'https://www.alltrails.com/fr/randonnee/france/savoie/val-d-isere-lac-de-l-ouillette', label: "AllTrails — Lac de l'Ouillette" },
          ],
          tip: 'Départ avant 8h — montée longue.',
          notes: [], done: false,
          dplus: 700,
        }
      ]
    },
    {
      id: 'day_3', date: '2026-07-08', label: 'Mer 8 juil', type: 'rando',
      validated: false, activities: [
        {
          id: 'act_salin', emoji: '💧', title: 'Cascades de Salin + Gouille de Salin + Lac du Chevril',
          type: 'rando', difficulty: 'moyen',
          subtitle: 'Bois de Laye · résurgence mystérieuse · barrage le plus haut de France',
          startTime: '08:30', endTime: '13:30',
          distanceKm: 9.5, durationMin: 180,
          features: ['cascade', 'lac', 'vue'],
          desc: "Depuis La Daille (bus rouge), sentier dans le <strong>Bois de Laye</strong>.<br><br>• <strong>Gouille de Salin</strong> — eau du glacier qui ressort du sol<br>• <strong>Cascades de Salin</strong> — plusieurs chutes imposantes<br>• Vue panoramique sur le <strong>lac du Chevril</strong> (barrage 160m)",
          gear: ['Chaussures de rando', 'Eau 1,5L', 'Coupe-vent'],
          links: [
            { url: 'https://www.alltrails.com/fr/randonnee/france/savoie/la-daille-bois-de-laye-lac-du-chevril', label: 'AllTrails — Bois de Laye' },
          ],
          tip: 'Départ 8h30.',
          notes: [], done: false,
          dplus: 350,
        }
      ]
    },
    {
      id: 'day_4', date: '2026-07-09', label: 'Jeu 9 juil', type: 'rando',
      validated: false, activities: [
        {
          id: 'act_montroup', emoji: '🌸', title: 'Tour du Mont Roup + Cascades du Saut du Pisset',
          type: 'rando', difficulty: 'moyen',
          subtitle: 'Boucle Vanoise · double cascade remarquable · 4,9⭐ AllTrails',
          startTime: '08:15', endTime: '14:00',
          distanceKm: 12, durationMin: 330,
          features: ['cascade', 'faune', 'vue'],
          desc: "<strong>La rando coup de cœur — 4,9/5 AllTrails.</strong><br><br>Sens <strong>anti-horaire (par les Pissets)</strong> pour voir la cascade avant la montée.<br><br>• <strong>Cascade du Saut du Pisset</strong> — double écoulement remarquable<br>• <strong>Lac du Grapillon</strong> (2665m)<br>• Marmottes + Vue Mont Blanc",
          gear: ['Chaussures de rando semelle crantée', 'Bâtons recommandés', 'Eau 2L minimum', 'Pique-nique complet', 'Coupe-vent (2600m+)', 'Crème solaire SPF 50+'],
          links: [
            { url: 'https://www.visorando.com/randonnee-tour-du-mont-roup/', label: '🗺 Visorando — Tour du Mont Roup' },
            { url: 'https://www.alltrails.com/fr/randonnee/france/savoie/tour-du-mont-roup', label: 'AllTrails — Tour du Mont Roup' },
          ],
          tip: 'Départ 8h15. Sens anti-horaire. Ce soir : bagages prêts !',
          notes: [], done: false,
          dplus: 625,
        }
      ]
    },
    {
      id: 'day_5', date: '2026-07-10', label: 'Ven 10 juil', type: 'voyage',
      validated: false, activities: [
        {
          id: 'act_voyage_retour', emoji: '🚄', title: "Val d'Isère → Paris",
          type: 'voyage', difficulty: 'repos',
          subtitle: 'Altibus 09h00 · TER + TGV · Arrivée Paris 16h16',
          startTime: '09:00', endTime: '16:16',
          distanceKm: 800, durationMin: 436,
          features: [],
          desc: "<strong>🚌 Altibus 09h00</strong> Val d'Isère → BSM 09h40 · Réf BSG6411704<br><br><strong>🚄 10h13</strong> BSM → Albertville 11h15 · Correspondance 10 min<br><br><strong>🚌 11h25</strong> → Chambéry 12h57<br><br><strong>🚄 13h23</strong> TGV 6972 · Voiture 8 · Siège 827 → Paris <strong>16h16</strong>",
          gear: ['Bagages prêts la veille', 'Billet Altibus (BSG6411704)', 'Snacks'],
          links: [{ url: 'https://www.altibus.com', label: 'Altibus — modifier/annuler billet' }],
          tip: '⚠️ Se présenter Gare Routière avant 08h45.',
          notes: [], done: false,
        }
      ]
    },
  ]
}
