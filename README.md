# Séjours Vacances

Application web de planification de séjours & randonnées entre amis — React + Firebase.

## Stack
- **React 18 + Vite 5** — déployé sur Netlify via GitHub
- **Firebase Firestore** — sync temps réel entre appareils
- **Firebase Auth Google** — connexion Google obligatoire (toutes les entrées)
- **Gemini API** — IA activités via Netlify Function proxy (fallback chain multi-modèles)
- **Open-Meteo** — météo automatique par GPS (prévisions horaires, min/max, humidité, lever/coucher)
- **Nominatim** — géocodage adresse → lat/lon
- **QR Code** — générateur SVG pur JavaScript (aucune dépendance externe)

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
- Accès admin via "⚙️ Administration" dans le menu (desktop sidebar ou mobile "Plus")

## Règles Firestore
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid == 'lecSvR1xE5Ni17pngVfODqJ0XBs1';
    }
    match /users/{uid} {
      allow get: if true;
      allow list: if isAdmin();
      allow write: if request.auth != null && (request.auth.uid == uid || isAdmin());
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
      allow get: if request.auth != null && (request.auth.uid == uid || isAdmin());
      allow list: if isAdmin();
      allow write: if request.auth != null;
    }
  }
}
```

## Architecture UI

### Desktop
- **Sidebar fixe gauche** (220px) : navigation (Tableau de bord, Planning, Infos, Budget, Valise, Sac à dos, IA Activités, Aide & FAQ, Administration, Déconnexion)
- **MainHeader** : photo de fond adaptée à la destination, titre, date/heure, onglets séjours
- **Zone contenu** : bandeau séjour + onglets destination (si multi-dest) + météo, puis contenu de l'onglet actif

### Mobile (≤768px)
- Sidebar cachée
- **Bottom nav fixe** : Accueil / Planning / Budget / Plus → sheet avec tous les onglets
- Modales en **bottom sheet** (slide-up, coins arrondis, barre de tirage)

### Thème dynamique
- Gradient qui change selon la **saison** ET l'**heure** (nuit/aube/matin/après-midi/soir)
- Photo de fond du header adaptée à la destination
- Cartes neutres/blanches pour la lisibilité

## Fonctionnalités

### Authentification
- **Google obligatoire** — seule porte d'entrée, que ce soit par connexion directe, lien d'invitation, code, ou QR code
- Auto-link rétroactif : quand un utilisateur se connecte avec Google, son UID est automatiquement rattaché à ses profils voyageur existants (par correspondance email)

### Multi-destination (Étapes)
- Un séjour peut avoir **plusieurs destinations** (ex: Val d'Isère → Grenoble → Annecy)
- Chaque étape a : nom, dates, couleur, hébergement, coordonnées GPS, photo, jours/planning
- **Commun** au voyage : voyageurs, budget
- Onglets destination dans le bandeau du séjour, bouton "＋ Étape" toujours accessible
- Ajout possible à la **création**, en **modification**, ou **à tout moment** pendant/après le séjour
- Planning, Infos, Météo, IA = scoped à l'étape active
- Rétrocompatible avec les séjours simple destination

### Invitation
- Lien de partage avec code unique + QR code SVG pur
- Code d'invitation depuis l'écran de connexion (→ vérification → Google login)
- Inviter depuis le tableau de bord ou la page Infos
- Liens avec max utilisations, expiration, compteur

### Planning & Activités
- Planning par jour avec validation
- **Drag & drop** pour réordonner les activités dans un jour
- **"Non fait" (⏭)** : marquer une activité comme non réalisée → exclue des stats (km, durée, coût)
- **Prix par activité** : champ € avec option "Ajouter au budget" (commune ou perso)
- **Source IA** affichée sous chaque suggestion
- L'IA ne repropose pas les activités déjà planifiées
- Liens AllTrails/Visorando seulement pour les randonnées, Google pour tout
- Formulaire : emoji, durée h+min, distance, D+, difficulté, description, conseil, matériel, liens

### Budget (4 onglets)
- **Vue d'ensemble** : budget restant, progression, métriques, donut catégories, dépenses par jour, dépenses récentes (→ "Voir tout"), bilan par personne
- **Dépenses** : liste filtrable (Toutes/Communes/Perso), recherche, filtre catégorie, cards avec menu ⋯ (Modifier / Supprimer), association à une activité
- **Remboursements** : style Splitwise (qui doit combien à qui), marquer comme réglé, historique
- **Statistiques** : évolution par jour, donut catégories, qui dépense le plus, commun vs perso
- Dépassement budget affiché clairement ("Dépassé de X€")
- Lien bidirectionnel activité ↔ dépense

### Météo
- 2 cards : résumé (icône + temp + ressenti + 4 métriques : min/max, vent, humidité, lever/coucher) + prévisions horaires scrollables
- Alertes météo honnêtes (source Open-Meteo, lien vers Météo France Vigilance)
- S'adapte à l'étape active en multi-destination

### Valise (refonte)
- Items par **catégorie** : Vêtements, Toilette, Tech, Matériel rando, Nourriture, Autre
- **Filtres** : Tout / À faire / Essentiels / Consommables
- Badges : Essentiel, Consommable, Partagé avec
- **Suggestions automatiques** basées sur le matériel recommandé des activités
- Par voyageur, avec quantités

### Sac à dos (refonte)
- **Onglet Base** : items permanents (toujours dans le sac)
- **Onglets par jour** : items supplémentaires spécifiques à la journée
- **Suggestions matériel** tirées du champ "gear" des activités du jour
- Items partagés entre voyageurs (qui prend quoi pour le groupe)

### Tableau de bord (Hype Up)
- **Avant le départ** : countdown (Xj Xh Xm)
- **Pendant le séjour** : programme d'aujourd'hui (activités cliquables → modal détail avec Valider/Non fait/Aller à l'activité) + aperçu de demain
- **Après le séjour** : Souvenirs (récap stats, photos par journée, clore/archiver)
- Statistiques du séjour, voyageurs, programme avec emojis activités
- Jours du programme cliquables (→ planning + scroll au bon jour)

### Clore / Archiver
- **Clore** : séjour officiellement terminé (badge 🔒), reste visible
- **Archiver** : disparaît de la liste principale, section "Archives" en bas
- **Auto-archive** après 6 mois
- **Photos souvenirs** par journée (base64, max 2Mo)

### Admin (mode immersif)
- Quand tu gères un séjour, tu es **dedans** : header, photo, sidebar, tous les onglets = ceux du séjour géré
- Bandeau violet "Mode admin" avec bouton quitter
- Toutes les actions (planning, budget, valise, sac, voyageurs) écrivent dans les données Firebase du propriétaire
- Liste utilisateurs : séjours créés + séjours rejoints + liaison UID ↔ voyageur
- Voyageurs : badge "🔗 Compte lié" ou "Sans compte"

### Voyageurs
- Gestion par séjour
- En multi-destination : voyageurs assignables par étape
- Modal avec ajout, suppression, modification email

### FAQ
- Onglet "❓ Aide & FAQ" dans le menu (desktop + mobile)
- 7 sections en accordéon, questions/réponses en langage simple
- Couvre : Général, Invitations, Planning, Budget, Valise/Sac, Météo, Après le séjour

## Déploiement
1. Modifier les fichiers sur `github.dev/AharoneAferyat/sejours-vacances`
2. Commit & Push
3. Netlify rebuilde automatiquement (~1-2 min)

## Seed (données initiales)
Après connexion Google, dans la console F12 :
```js
await seedDatabase()
```
À lancer **une seule fois**.

---

## Historique des modifications

### Session 1 — Juin 2026
- Création du projet React + Vite
- Structure 3 colonnes, données Val d'Isère codées en dur → Firebase

### Session 2 — Juin 2026
- Firebase Firestore sync, Google Auth, Seed, Infos éditables, fix dates, responsive

### Session 3 — Juin 2026
- Renommage Séjours Vacances, Header dynamique saison/heure, IA Gemini planning semaine, Système d'invitation

### Session 4 — Juillet 2026
- Refonte UI : sidebar + MainHeader photo + bottom nav mobile
- Admin inline, photo destination, thème dynamique, IA renommée, Dashboard Hype Up
- Toolbar emoji, liens auto, admin gestion séjour complet, page d'accueil vide

### Session 5 — Juillet 2026
- **Budget refait** : 4 onglets (Vue d'ensemble, Dépenses, Remboursements Splitwise, Statistiques)
- **Météo refaite** : 2 cards (résumé + prévisions horaires), données honnêtes, alertes source Open-Meteo
- **Admin immersif** : header/sidebar/onglets = séjour géré, valise/sac/voyageurs synchro
- **Multi-destination** : étapes avec onglets, ajout à tout moment, planning/météo/infos scoped
- **Hype Up 3 modes** : countdown / aujourd'hui cliquable (modal détail) / souvenirs + photos
- **Clore / Archiver** séjours + auto-archive 6 mois
- **IA améliorée** : pas de doublons, source affichée, liens intelligents (AllTrails si rando, Google sinon)
- **Voyageurs par étape** + liaison user ↔ voyageur (UID Google) + auto-link rétroactif
- **Connexion Google obligatoire** partout (code + lien + QR → Google)
- **Drag & drop** activités pour réordonner
- **"Non fait"** : exclure activité des stats sans supprimer
- **Prix activité** : champ €, ajout auto au budget (commun ou perso), lien activité ↔ dépense
- **Modification dépenses** (pas juste suppression)
- **Dépassement budget** clairement affiché
- **Valise refaite** : catégories, filtres, badges (essentiel/consommable/partagé), suggestions IA
- **Sac à dos refait** : base + par jour, suggestions matériel, items partagés
- **FAQ** : onglet complet, 7 sections, langage simple
- **QR codes** invitations (SVG pur JS, aucune API externe)
- **Programme du séjour** cliquable (→ planning + scroll)
- **Emojis activités** dans le programme du dashboard
- **Bottom sheet** modales sur mobile
- **Responsive** : budget, météo, dashboard, valise, sac adaptés mobile

---

## Backlog

### À tester sur le terrain
- [ ] Multi-destination : flow complet création → gestion → switch étapes
- [ ] Valise/Sac refondus : catégories, suggestions, par jour
- [ ] Budget ↔ Activité : lien bidirectionnel, ajout auto
- [ ] Drag & drop sur mobile (touch)
- [ ] QR codes : scan et parcours complet d'invitation

### Améliorations futures
- [ ] PWA / mode hors-ligne
- [ ] Export PDF (budget, séjour complet)
- [ ] Notes/commentaires entre voyageurs par activité
- [ ] Poids estimé du sac à dos
- [ ] SNCF : champ référence réservation + lien suivi
- [ ] Airbnb : champ lien hébergement avec preview
