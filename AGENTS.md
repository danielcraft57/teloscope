# AGENTS.md — Teloscope

Guide pour les agents qui modifient ce dépôt.

## Rôle du dépôt

**Teloscope** = vitrine statique + parcours utilisateur (vérifier un numéro → découvrir le filtre matériel).  
**VocalGuard** = moteur (API, Celery, base, OSINT réel). Ne pas dupliquer la logique OSINT ici sauf maquette ou client HTTP mince.

## Priorité produit (ordre obligatoire)

1. **Vérification / enrichissement téléphone** — UX claire, résultats structurés, mode démo si pas d’API.
2. **Application mobile** (`mobile/`) — vérif numéro, enregistrement message, blocage Android via `CallScreeningService` (build natif, pas Expo Go).
3. **Offre matérielle anti-sollicitations commerciales** — message commercial, pas de schéma technique détaillé sur le site public sans accord explicite.

## Fichiers à connaître

- `site/index.html` — accueil, entonnoir produit
- `site/verify.html` + `site/verify.js` — lookup numéro
- `site/hardware.html` — offre boîtier / filtrage
- `site/config.js` — `apiBase` pour VocalGuard
- `site/style.css` — thème unique, pas de framework lourd

## Règles de modification

- Garder le site **statique** (pas de backend dans ce repo sauf demande explicite).
- Chemins CSS/JS : préférer **relatifs** (`style.css`) pour le dev local ; les liens de nav peuvent rester relatifs (`verify.html`).
- Ne pas promettre sur la vitrine des sources OSINT illégales ou du scraping hors cadre.
- Texte en **français** pour l’UI publique.
- Ne pas committer de secrets (clés API) dans `config.js` — l’API VocalGuard est côté serveur.

## Mode démo vs API

- `apiBase` vide → `verify.js` génère un profil démo déterministe (hash du numéro).
- `apiBase` renseigné → `GET` vers `{osintPath}/{numéro}` (VocalGuard `/api/v1/osint/phone/…`), mappé via `site/osint-mapper.js` ou `mobile/src/lib/vocalguard.ts`.

## Déploiement

Contenu servi depuis `site/` vers `/var/www/teloscope`. Pas de build obligatoire ; `npm run dev` utilise `serve` pour le preview.

## Hors scope par défaut

- Implémentation complète VocalGuard
- Paiement, compte utilisateur cloud
- Détails du firmware / schéma du filtre matériel sur les pages publiques
