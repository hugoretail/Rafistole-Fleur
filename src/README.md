# Rafistole Fleur

Une experience narrative React + Three.js pour la NDI 2025 qui montre comment une ecole peut reduire sa dependance numerique sans perdre son elan creatif. Le site combine une scene 3D ludique, des animations framer-motion et un parcours en trois chapitres.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

- `npm run dev` lance le serveur Vite sur [http://localhost:5173](http://localhost:5173).
- `npm run build` produit le bundle de production.
- `npm run preview` sert le bundle genere.
- `npm run lint` verifie les regles ESLint et TypeScript.

## Tech

- React 18 + Vite 5 + TypeScript
- react-three-fiber & drei pour la scene 3D
- three.js pour la geometrie custom
- valtio pour le state narratif
- framer-motion pour les transitions de chapitres
- Sass pour le style experimental
- Constellation des partenaires pour mettre en avant les allies NDI 2025

## Structure rapide

```
src/
  components/   // Experience 3D + HUD
  content/      // Chapitres et textes
  state/        // Store Valtio
  styles/       // SCSS (variables + layout)
```

## Idee narrative

Chaque chapitre represente une maniere concrete de reduire la dependance numerique: reparer, mutualiser, celebrer. La camera se deplace automatiquement entre les ilots 3D, tandis qu'un HUD invite a declencher les evenements (autopilote ou mode manuel).

## Allies 2025

Le panneau "Constellation des Allies" relie les partenaires (Viveris, Rimini Street, etc.) a leurs engagements 2025. Les filtres par focus permettent de changer le cluster observe, les cartes detaillees affichent les signaux faibles, et les boutons indiquent les actions a lancer ou les allies a combiner.

## Defi Hidden Snake

- Methodologie secrete: couper l'autopilote dans le HUD, puis taper FLEUR (lettres sequentielles) en moins de sept secondes.
- Un portail visuel "Hidden Snake / Mode Lotus" s'ouvre et propose un bouton vers [https://serpentini.mateoguidi.fr](https://serpentini.mateoguidi.fr).
- Refermez ou relancez le portail depuis la meme zone si besoin.
- Penser a envoyer un mail a `n2i@autocut.com` avec le lien du site ainsi que la methode d'activation, comme demande par le brief.

## Defi Capgemini — Visualisation Audio

- Deux boutons en haut a droite activent le mode `🎙 Mode micro` (utilise votre micro) ou `♫ Mode musique` (synth retro integre).
- Une fois actif, les modes tournent toutes les 5 secondes et animent tout le site:
  - **Mode 1 / Rafistole Quake**: vibrations sur le texte, les cartes et la scene 3D.
  - **Mode 2 / Flux Glitch**: filtres chromatiques et bruits lumineux couples au spectre audio.
  - **Mode 3 / Ondes Jukebox**: vagues neon jaillissant des bords, ambiance dancefloor.
- Le panneau affiche en temps reel la puissance captee (barre d'intensite) et permet d'arreter ou de relancer une source.
- En mode musique, choisis une piste dans la liste (Cardigan, Real Man, Right Now ou 踊り子) pour changer l'ambiance sans recharger la page.
- Pour des tests hors evenement, donner l'autorisation micro au navigateur ou rester sur le mode musique qui utilise uniquement l'API Web Audio.
