# Mobile (wrapper) — PWA / Capacitor (MVP)

Objectif : rendre l’app installable sur iOS/Android (mode “app”),
et préparer la réception d’alertes.

## 1) PWA (le plus simple)

Le projet expose :
- un manifest : `/manifest.webmanifest`
- des icônes générées via routes :
  - `/icon-192.png`
  - `/icon-512.png`
  - `/apple-touch-icon.png`

Pré-requis :
- HTTPS (obligatoire pour une PWA installable + futures notifications Web Push)

### iOS (Safari)
1. Ouvrir le site.
2. “Partager” → “Sur l’écran d’accueil”.
3. L’app s’ouvre ensuite en standalone.

### Android (Chrome)
1. Ouvrir le site.
2. Menu → “Installer l’application”.

## 2) Wrapper natif (Capacitor)

Pour publier sur les stores et accéder aux APIs natives (push, etc.),
vous pouvez wrapper l’app avec Capacitor.

Principe :
- build Next.js (production)
- embarquer le build dans une WebView Capacitor
- activer les plugins nécessaires (Push, etc.)

## 3) Notifications

- Les notifications sont internes à l’app (centre + badge).
- Pour des “vraies push” iOS/Android : la base est prête (PWA/wrapper),
  il faudra ajouter Web Push ou Capacitor Push (plus tard).

À prévoir :
- consentement explicite
- quiet hours
- fréquence max
- opt-out
