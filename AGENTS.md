# AGENTS.md — Teloscope

**Un seul dépôt à modifier : Teloscope.** Pas de dépendance à d’autres projets DanielCraft pour faire tourner l’OSINT.

## Architecture

| Composant | Rôle |
|-----------|------|
| `site/` | Vitrine statique, `verify.html` appelle l’API |
| `backend/` | FastAPI OSINT (`/api/v1/osint/phone/{numero}`) |
| `mobile/` | Expo + module Android call screening |
| `docs/OSINT.md` | Liste des outils |

## API

- `GET /api/v1/osint/phone/+33…` — enrichissement
- `GET /api/v1/osint/tools` — outils actifs
- Clients : `site/osint-mapper.js`, `mobile/src/lib/osint-response.ts`

## Règles

- Nouvelles briques OSINT → `backend/services/`, pas ailleurs.
- Site reste statique ; pas de logique OSINT lourde dans `site/` sauf démo.
- UI en français. Pas de secrets dans le repo.
- `apiBase` vide = mode démo site/mobile.

## Priorité produit

1. Vérification numéro (API + UX)
2. App mobile (blocage commercial Android)
3. Vente matérielle (message public limité)

## Hors scope

- Paiement, comptes cloud
- Détails firmware filtre matériel sur le site public
