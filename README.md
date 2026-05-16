# Teloscope

Vitrine publique pour **fakecom.me**, **faketel.me** et **fauxtel.me**.

## Produit en deux temps

1. **Vérifier un numéro** — OSINT et sources légales (opérateur, type de ligne, réputation, signaux publics) pour décider avant de répondre.
2. **Protéger la ligne** — vente d’un **équipement matériel** qui filtre les appels commerciaux en amont du poste.

Teloscope est le **nom et le parcours client** côté `.me`. Le moteur d’enrichissement vit dans **VocalGuard** (`backend/services/osint_service.py`, profils `phone_number_profiles`, APIs NumLookup / PhoneInfoga, etc.).

## Dépôt

| Chemin | Rôle |
|--------|------|
| `site/` | Site statique (HTML, CSS, JS) |
| `site/verify.html` | Formulaire de vérification de numéro |
| `site/hardware.html` | Présentation de l’offre matérielle |
| `site/config.js` | URL de l’API VocalGuard (vide = mode démo) |

## Développement local

```bash
npm run dev
```

Ouvre `http://localhost:3080`. Sans API configurée, `/verify.html` fonctionne en **mode démo** (résultats déterministes, pas d’appel réseau OSINT).

### Brancher l’API VocalGuard

Éditer `site/config.js` :

```js
window.TELOSCOPE_CONFIG = {
  apiBase: "https://votre-instance-vocalguard.example",
  lookupPath: "/api/v1/phone/lookup"
};
```

Le client envoie un `POST` JSON `{ "phone": "+33..." }` et affiche la réponse. Adapter `lookupPath` si votre route diffère.

## CI / CD (GitHub Actions)

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| `ci.yml` | push / PR sur `main` | `npm run check`, artifact `site/` |
| `deploy.yml` | push sur `main` ou manuel | rsync SSH vers le serveur |

### Secrets (Settings → Secrets → Actions, environnement `production`)

| Secret | Exemple |
|--------|---------|
| `SSH_PRIVATE_KEY` | Clé privée déploy (PEM) |
| `SSH_HOST` | `node12.lan` |
| `SSH_USER` | utilisateur SSH |
| `SSH_PORT` | `22` (optionnel) |
| `DEPLOY_PATH` | `/var/www/teloscope/` |

Sans ces secrets, le **CI** passe ; le **deploy** échoue jusqu’à configuration.

Déploiement manuel : onglet Actions → Deploy → Run workflow.

## Déploiement manuel

Copier `site/` vers `/var/www/teloscope` sur `node12.lan`. Script domaines : `../configuration-mail/scripts/add_domains_teloscope_me.sh`.

## Éthique et légal

Vérifications limitées aux sources autorisées et à une finalité documentée. Pas de promesse de capacités hors cadre contractuel sur la vitrine.

## Voir aussi

- `AGENTS.md` — consignes pour les agents Cursor sur ce dépôt
- Projet **VocalGuard** — implémentation OSINT et appels
