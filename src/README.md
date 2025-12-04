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
