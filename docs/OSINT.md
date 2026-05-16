# OSINT Teloscope

Tout le stack OSINT vit **dans ce dépôt** (`backend/`).

## Outils

| Outil | Disponibilité |
|-------|----------------|
| `commercial_detector` | Toujours (08/09, patterns télémarketing) |
| `french_phone` | Toujours (zone fixe, type mobile) |
| `phoneinfoga` | Si `phoneinfoga` est dans le PATH |
| `numlookup` | Si `NUMLOOKUP_API_KEY` dans `backend/.env` |
| `numverify` | Si `NUMVERIFY_API_KEY` dans `backend/.env` |

Liste en direct : `GET /api/v1/osint/tools`

## Installation PhoneInfoga (optionnel)

```bash
go install github.com/sundowndev/phoneinfoga/v2@latest
```

## Éthique

Sources publiques et APIs avec conditions d’usage respectées. Pas de contournement de cadre légal.
