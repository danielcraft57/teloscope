# API Teloscope (OSINT)

Backend **dans ce dépôt** — plus besoin d’un autre projet pour la vérification de numéros.

## Lancer

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env     # clés API optionnelles
uvicorn main:app --reload --port 8090
```

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /health` | Santé |
| `GET /api/v1/osint/phone/{numero}` | Enrichissement OSINT |
| `GET /api/v1/osint/tools` | Outils disponibles sur la machine |
| `GET /api/v1/osint/commercial/{numero}` | Détection commerciale seule |

## Outils

- **Toujours** : détection commerciale FR, indicatifs français
- **Si installé** : PhoneInfoga (`phoneinfoga` dans le PATH)
- **Si clé `.env`** : NumLookup, NumVerify, OpenCNAM (à venir)

## Brancher le site / l’app

```js
// site/config.js
apiBase: "http://localhost:8090"
```

```json
// mobile/app.json → extra
"apiBase": "http://VOTRE_IP:8090"
```

Sur le serveur, mettre un reverse proxy (nginx) : `/api` → port 8090.
