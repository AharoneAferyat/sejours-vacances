# Vacances Aharone

Application web de planification de vacances — React + Firebase.

## Stack
- **React 18 + Vite 5** — déployé sur Netlify via GitHub
- **Firebase Firestore** — sync temps réel entre appareils
- **Firebase Auth Google** — connexion Google obligatoire
- **Gemini 1.5 Flash** — IA randos via Netlify Function proxy
- **Open-Meteo** — météo automatique par GPS
- **Nominatim** — géocodage adresse → lat/lon

## URLs
- Site : https://sejours-vacances.netlify.app
- Code : https://github.dev/AharoneAferyat/sejours-vacances

## Firebase
- Project ID : `sejours-vacances`
- Auth : Google Sign-In activé
- Domaine autorisé : `sejours-vacances.netlify.app`

## Déploiement
1. Modifier les fichiers sur `github.dev/AharoneAferyat/sejours-vacances`
2. Commit & Push
3. Netlify rebuilde automatiquement

## Seed (données initiales Val d'Isère)
Après connexion Google, dans la console F12 :
```js
await seedDatabase()
```
À lancer **une seule fois**. Ne pas relancer sauf si on veut repartir de zéro.

## Voyageurs & Accès
- **Avec email Google** : la personne se connecte avec son compte Google
- **Sans email** : un code d'accès est généré automatiquement (nom+séjour)
- Chaque voyageur a sa propre valise et son propre sac à dos
- Les données sont partagées dans Firebase sous le même UID organisateur

---

## Historique des modifications

### Session 1 — Juin 2026
- Création du projet React + Vite
- Structure 3 colonnes (valise | planning | sac)
- Données Val d'Isère codées en dur → **remplacé par Firebase**
- Header avec heure locale + UTC, onglets séjours

### Session 2 — Juin 2026
- Firebase Firestore pour sync entre appareils
- Google Auth — connexion obligatoire, ID = UID Google
- Seed pour initialiser les données Val d'Isère dans Firebase
- Infos éditables (plus de données codées en dur)
- Voyageurs fusionnés avec invitations (email ou code)
- Fix bug dates (toISOString → getDate local)
- Responsive mobile amélioré

---

## À faire / Backlog

- [ ] Connexion par code (sans compte Google) — système de code voyageur
- [ ] IA Gemini — vérifier que la Netlify Function est bien déployée
- [ ] Météo auto — vérifier géocodage sur nouveau séjour
- [ ] Post-séjour — highlights + photos par jour
- [ ] Notifications — rappel la veille de chaque rando
- [ ] Mode hors-ligne — PWA

