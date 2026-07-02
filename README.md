# Séjours Vacances

Application web premium de planification de séjours & randonnées — React + Firebase.

## Stack
- **React 18 + Vite 5** — déployé sur Netlify via GitHub
- **Firebase Firestore** — sync temps réel entre appareils
- **Firebase Auth Google** — connexion Google obligatoire
- **Gemini API** — IA activités via Netlify Function proxy (fallback chain multi-modèles)
- **Open-Meteo** — météo automatique par GPS
- **Nominatim** — géocodage adresse → lat/lon

## URLs
- Site : https://sejours-vacances.netlify.app
- Code : https://github.dev/AharoneAferyat/sejours-vacances

## Firebase
- Project ID : `sejours-vacances`
- Auth : Google Sign-In activé
- Domaine autorisé : `sejours-vacances.netlify.app`

## Variables d'environnement Netlify
- `GEMINI_API_KEY` — clé principale Gemini
- `GEMINI_API_KEY_2` — clé secondaire Gemini
- `NODE_VERSION` — 18

## Admin
- **Un seul admin** : UID `lecSvR1xE5Ni17pngVfODqJ0XBs1` (aaferyat@gmail.com)
- Pas de check par email — uniquement par UID Firebase
- Accès admin via onglet "Administration" dans la sidebar (desktop) ou "Plus" (mobile)

## Règles Firestore
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow get: if true;
      allow list: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /guestAccess/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /inviteCodes/{code} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /allowedUsers/{uid} {
      allow get: if request.auth != null && request.auth.uid == uid;
      allow list: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Architecture UI

### Desktop
- **Sidebar fixe gauche** (220px) : logo + navigation (Tableau de bord, Planning, Infos, Budget, Valise, Sac à dos, IA Activités) + bas (Voyageurs, Budget global, Administration, Déconnexion, user connecté)
- **MainHeader** (haut, pleine largeur) : photo de fond adaptée à la destination, titre "Séjours Vacances", date/heure, onglets séjours avec ✏️🗑
- **Zone contenu** : bandeau séjour + météo (toujours visibles sauf admin), puis contenu de l'onglet actif

### Mobile (≤768px)
- Sidebar cachée (`display:none`)
- MainHeader responsive (même contenu, tailles adaptées)
- **Bottom nav fixe** : Accueil / Planning / Budget / Plus → sheet (Infos, Valise, Sac, IA Activités, Voyageurs, Budget global, Admin, Déco)

### Thème dynamique
- Gradient qui change selon la **saison** (printemps/été/automne/hiver) ET l'**heure** (nuit/aube/matin/après-midi/soir)
- Photo de fond du header adaptée à la destination (montagne/mer/ville/forêt/lac)
- Cartes toujours neutres/blanches pour la lisibilité

## Fonctionnalités

### Système d'invitation
- Collection Firestore `inviteCodes/{code}` — format `INV-XXXXXX`
- Collection `allowedUsers/{uid}` — utilisateurs autorisés
- Écran d'invitation au login : entrer code → connexion Google → accès
- Règles Firestore : `inviteCodes` read=public (validation avant connexion)

### Admin Panel (inline, pas modal)
- 3 onglets : Utilisateurs & séjours / Budget global / Codes d'invitation
- **Gestion utilisateurs** : 🚫 Révoquer (garde séjours, retire accès) / 🗑 Supprimer (tout supprimer)
- **Gestion séjours** : 👁 Voir / 🗑 Supprimer par séjour
- Budget global admin : agrège tous les séjours de tous les utilisateurs
- Quand admin actif : météo/bandeau séjour cachés, photo générique montagne

### IA Activités
- Proxy `netlify/functions/gemini.mjs` : fallback chain `gemini-2.0-flash-lite → gemini-2.0-flash → gemini-2.5-flash`
- JSON parsé côté serveur, renvoyé `{ok:true, data:[...]}`
- `thinkingBudget:0` sur gemini-2.5, `maxOutputTokens:4000`
- Support `GEMINI_API_KEY` + `GEMINI_API_KEY_2`
- Liens de recherche générés automatiquement (Google, AllTrails, Visorando) depuis le titre
- Message quota affiché dans la page IA Activités
- Mode recherche libre + mode planning semaine

### Formulaire activité
- Toolbar emoji (17 emojis rapides) sur description et conseil
- Formatage **gras** (`**texte**`) et _italique_ (`_texte_`) avec rendu HTML
- Sélecteur emoji pour le titre
- Gestion correcte des activités IA (id toujours généré, pas de crash à l'édition)

### Date picker
- `input type="date"` natif avec affichage du jour de la semaine sous le champ

### Page d'accueil vide (nouveaux utilisateurs)
- Hero avec message personnalisé "Bienvenue, [prénom] !"
- Section "Comment ça marche" (4 étapes)
- Idées de séjours cliquables (montagne, mer, ville, forêt, vélo, ski)

## Déploiement
1. Modifier les fichiers sur `github.dev/AharoneAferyat/sejours-vacances`
2. Commit & Push
3. Netlify rebuilde automatiquement (~1-2 min)

## Seed (données initiales Val d'Isère)
Après connexion Google, dans la console F12 :
```js
await seedDatabase()
```
À lancer **une seule fois**.

---

## Historique des modifications

### Session 1 — Juin 2026
- Création du projet React + Vite
- Structure 3 colonnes (valise | planning | sac)
- Données Val d'Isère codées en dur → remplacé par Firebase
- Header avec heure locale + UTC, onglets séjours

### Session 2 — Juin 2026
- Firebase Firestore pour sync entre appareils
- Google Auth — connexion obligatoire
- Seed pour initialiser les données Val d'Isère
- Infos éditables, voyageurs fusionnés avec invitations
- Fix bug dates (toISOString → getDate local)
- Responsive mobile amélioré

### Session 3 — Juin 2026
- Renommage → Séjours Vacances, favicon SVG 🥾
- Header dynamique saison + heure
- IA Gemini : mode "Planning semaine"
- Fix Gemini : parsing JSON serveur, thinkingBudget:0, maxOutputTokens 4000
- Système d'invitation : codes INV-XXXXXX, panel admin

### Session 4 — Juillet 2026
- **Refonte UI** : sidebar desktop + MainHeader photo + bottom nav mobile
- Navigation par onglets (Tableau de bord, Planning, Infos, Budget, Valise, Sac, IA Activités)
- Contenu principal : affichage selon onglet actif (plus de 3 colonnes)
- Admin inline (pas modal) avec header + sidebar toujours visibles
- Photo de fond adaptée à la destination (Unsplash, détection par mots-clés)
- Thème dynamique saison/heure préservé
- IA Rando → IA Activités (renommage)
- Tableau de bord par défaut (Hype Up + météo)
- Météo toujours visible sauf en admin
- Date picker natif avec jour de la semaine
- Fix bug modification activité IA (id manquant → écran blanc)
- Toolbar emoji + gras/italique dans description/conseil
- Message quota IA
- Liens AllTrails/Visorando → liens de recherche Google générés automatiquement
- Admin : gestion utilisateurs (révoquer / supprimer) + gestion séjours (voir / supprimer)
- Admin UID uniquement (plus de check par email)
- Budget global admin (agrège tous les utilisateurs)
- Page d'accueil pour nouveaux invités (EmptyState)

---

## Backlog / À faire

### Priorité haute
- [ ] Responsive admin mobile — checkup CSS complet
- [ ] Responsive général — checkup toutes tailles (320px → 1920px)
- [ ] Suppression séjours/utilisateurs — vérifier que ça fonctionne correctement
- [ ] Lien d'invitation par séjour (rejoindre librement, sans code admin)
- [ ] Tricount — choix des participants par dépense + option "tout le monde"
- [ ] Jour de voyage (aller/retour) — visuellement distinct dans le planning

### Moyen terme
- [ ] **Road trip / multi-destinations** — plusieurs lieux par séjour, météo qui suit
- [ ] **SNCF** — champ référence de réservation, lien direct vers suivi
- [ ] **Airbnb** — champ lien hébergement avec preview
- [ ] **Hype Up amélioré** — plus riche, plus proche du mockup de référence
- [ ] PWA / mode hors-ligne
- [ ] Notifications : rappel la veille de chaque rando
- [ ] Post-séjour : highlights/photos
- [ ] GlobalBudget : export PDF
- [ ] Multi-clés Gemini supplémentaires si quota insuffisant
- [ ] Liens AllTrails/Visorando — utiliser de vrais liens directs au lieu de recherche

### Nice to have
- [ ] Connexion par code voyageur : tester end-to-end
- [ ] Budget : estimation coût activités dans le planning
- [ ] Budget : notification si budget bientôt dépassé
