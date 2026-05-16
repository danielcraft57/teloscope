# Teloscope Mobile

Application **Android** (build natif) pour :

1. **Vérifier** un numéro (OSINT Teloscope / VocalGuard, mode démo sans API).
2. **Enregistrer** un message audio pour les appelants commerciaux.
3. **Couper** les appels des numéros marqués commerciaux (`CallScreeningService`).
4. **Consulter** le journal des blocages.

> **Expo Go** : UI seulement, pas de filtrage d’appels. Utilisez `npm run android` (development build).

## Prérequis

- Node 22+
- Android Studio / SDK pour l’émulateur ou un appareil USB

## Commandes

```bash
cd mobile
npm install
npm start          # Metro
npm run android    # compile + installe (module natif)
npm run typecheck
```

## Configuration API

Dans `app.json` → `expo.extra` :

```json
"apiBase": "https://votre-vocalguard.example",
"lookupPath": "/api/v1/phone/lookup"
```

## Android — rôle filtrage

1. Enregistrez un message (onglet **Message**).
2. Accueil → **Demander le rôle** → choisir Teloscope comme app filtrage d’appels.
3. Activez la **Protection**.

Les numéros ajoutés via **Vérifier** → « Bloquer ce numéro » ou la liste interne sont rejetés.

### Message à l’appelant

Le fichier audio est stocké sur l’appareil et référencé lors du blocage. La **lecture automatique à l’appelant** à la décrochée nécessite le boîtier Teloscope ou une évolution telecom ; le screening Android **coupe** l’appel sans réponse vocale intégrée au réseau.

## iOS

Vérification et message : oui. Blocage automatique : non (limitations Apple) — utiliser le filtre matériel Teloscope.

## Module natif

`modules/teloscope-screening/` — `CommercialCallScreeningService`, prefs partagées avec React Native.
