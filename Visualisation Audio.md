# Visualisation Audio · Rafistole Fleur

## Sujet
CAPGEMINI · Défi National « Visualisation Audio »: relancer l’audio-viz rétro avec une proposition fun, inventive et pleinement interactive.

## Notre réponse
- **Source audio**: lecture MP3 et mode micro pour capter voix, beatbox, ambiance.
- **Analyse**: pipeline Web Audio (FFT 1024) avec suivi RMS, pics, basses, hyper bursts, spectre complet exposé à l’UI.
- **Expérience visuelle**: scène neon Three.js rafistole + couche HUD (blobs, beams, shards, shockwaves) pilotée par `burst`, `hyperLevel` et par le spectre.
- **UI/contrôles**: sélection de piste, vue spectrale excitée basée sur amplitude, bascule mic/musique, rotation automatique des modes visuels.

## Points clefs évalués
- **Inventivité**: wavefield chromatique, strobe adaptatif, surcouche CSS pulsée par basses.
- **Couplage audio/source**: normalisation dynamique (floor/ceiling adaptatifs, suivi basses) pour éviter le 100% permanent.
- **Fun**: pics → hyper explosions, stroboscope, caméra vibrante.

## Livrable
- Application Vite/React déployable, prête à être hébergée pour l’arbitrage 5 minutes.
- Code modulable (`audioViz.ts`, `AudioVizPanel`, `AudioWavefield`, Sass) pour itérations rapides.
