# Teloscope

Vitrine **fakecom.me**, **faketel.me**, **fauxtel.me** + **API OSINT** + **app mobile** — un seul dépôt.

## Produit

1. **Vérifier un numéro** — OSINT (opérateur, type, commercial, réputation).
2. **Protéger la ligne** — app mobile (blocage Android) + filtre matériel.

## Structure

| Chemin | Rôle |
|--------|------|
| `site/` | Vitrine statique |
| `backend/` | **API Teloscope** (`GET /api/v1/osint/phone/…`) |
| `mobile/` | App Expo (filtrage + message commercial) |
| `docs/OSINT.md` | Outils OSINT supportés |

## Démarrage local

**1. API OSINT**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8090
```

**2. Site**

```bash
npm run dev
```

**3. Brancher l’API** — `site/config.js` :

```js
window.TELOSCOPE_CONFIG = {
  apiBase: "http://localhost:8090",
  osintPath: "/api/v1/osint/phone"
};
```

Sans `apiBase` : mode **démo** sur le site et l’app.

**4. Mobile** — `mobile/app.json` → `expo.extra.apiBase` (même URL).

```bash
cd mobile && npm run android
```

## CI / CD

Voir workflows `.github/workflows/`. Deploy : `site/` vers `/var/www/teloscope` ; l’API se déploie à part (systemd, Docker, ou proxy vers le port 8090).

## Voir aussi

- `AGENTS.md` — consignes agents Cursor
- `backend/README.md` — détail API
