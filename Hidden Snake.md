# Hidden Snake

Guide interne pour activer le mini-jeu cache "Hidden Snake / Mode Lotus" depuis Rafistole Fleur.

## Condition prealable
- Ouvrir le site Rafistole Fleur en production ou en dev (`npm run dev`). N'oubliez pas d'installer les dépendances d'abord ! (`npm install`)
- Attendre que la scene soit chargee (overlay disparait).
- Desactiver l'autopilote via le bouton "Autopilote on" dans le HUD des chapitres (il doit afficher "Mode manuel").

### Comment couper l'autopilote ?
1. Reperez le grand bloc HUD sous le hero (carte translucide avec titre de chapitre).
2. Dans la rangée de boutons sous le texte du chapitre, un bouton indique "Autopilote on" lorsque le pilotage automatique est actif.
3. Cliquez dessus une fois : le libellé devient **"Mode manuel"** et la camera cesse de changer de chapitre seule.
4. Tant que le bouton affiche "Mode manuel", la sequence secrete peut etre saisie. Cliquez a nouveau pour re-activer l'autopilote.

## Sequence secrete
1. Avec l'autopilote coupe, taper rapidement **F L E U R** (cinq touches separees).
2. Toute la sequence doit etre saisie en **moins de 7 secondes**.
3. Chaque lettre valide allume un glyphe jaune dans la balise "Balise clandestine" situee sous la constellation des partenaires.

> Astuce : si vous vous trompez ou depassez le delai, recommencez simplement la sequence depuis F.

## Resultat
- Une fois les 5 lettres valides, le **portail Hidden Snake / Mode Lotus** apparait (overlay violet).
- Ce portail contient :
  - Un rappel du brief Autocut
  - Un bouton "Lancer Serpentini" qui ouvre `https://serpentini.mateoguidi.fr` dans un nouvel onglet
  - Un bouton "Refermer le portail"
- Apres fermeture, un bouton "Relancer Hidden Snake" reste disponible pour rouvrir le portail sans retaper la sequence.

## Rappel concours
- Envoyer un mail a `n2i@autocut.com` avec :
  - Le lien du site Rafistole Fleur
  - La methode d'activation (autopilote off + code FLEUR)
- Ce message est necessaire pour la remise du lot en cas de victoire (250€ / 100€ Amazon).

## Tests rapides
- Verifier que la sequence fonctionne aussi bien en AZERTY/ QWERTY (lettres simples, aucun raccourci).
- S'assurer que la balise clandestine n'affiche rien en mode autopilote actif.
- Confirmer que le lien Serpentini s'ouvre dans un nouvel onglet.
