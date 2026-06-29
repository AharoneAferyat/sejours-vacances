# Séjours Vacances

Application web de planification de vacances — React + Firebase.

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
- `GEMINI_API_KEY` — clé principale Gemini (projet 872154608489)
- `GEMINI_API_KEY_2` — clé secondaire Gemini (projet 166826082299)
- `NODE_VERSION` — 18

## Règles Firestore
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /guestAccess/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /inviteCodes/{code} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email in ['aaferyat@gmail.com', 'ahaferyat5@gmail.com', 'aharone.aferyat@ght-gpne.fr'];
    }
    match /allowedUsers/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null;
    }
  }
}
```

## Admins
- `aaferyat@gmail.com`
- `ahaferyat5@gmail.com`
- `aharone.aferyat@ght-gpne.fr`

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
- Google Auth — connexion obligatoire, ID = UID Google
- Seed pour initialiser les données Val d'Isère dans Firebase
- Infos éditables, voyageurs fusionnés avec invitations
- Fix bug dates (toISOString → getDate local)
- Responsive mobile amélioré

### Session 3 — Juin 2026
- Renommage Vacances Aharone → Séjours Vacances
- Favicon SVG chaussure de rando
- Header dynamique : gradient selon saison + heure (nuit/aube/matin/après-midi/soirée)
- Horloge redesignée : date FR au-dessus, heure grosse, UTC + date EN discrets
- IA Gemini : nouveau mode "Planning semaine" (programme complet jour par jour, accepter/refuser/alternative)
- Fix Gemini : parsing JSON côté serveur, thinkingBudget:0 pour gemini-2.5, maxOutputTokens 4000
- Système d'invitation : codes INV-XXXXXX, panel admin, accès restreint aux non-invités

---

## À faire / Backlog

- [ ] **Road trip / multi-destinations** — plusieurs lieux par séjour, météo qui suit la localisation du jour actuel, pas d'adresse fixe unique
- [ ] Tester le système d'invitation end-to-end avec un vrai utilisateur
- [ ] Budget : estimation coût des activités (prix indicatif par activité)
- [ ] Budget : notification si budget bientôt dépassé
- [ ] Responsive : tester sur iPhone/Android et corriger
- [ ] PWA / mode hors-ligne
- [ ] Multi-clés Gemini supplémentaires si quota insuffisant
- [ ] Notifications : rappel la veille de chaque rando
- [ ] Post-séjour : améliorer la section highlights/photos
- [ ] GlobalBudget : export PDF ou partage du résumé
