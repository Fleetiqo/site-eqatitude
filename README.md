# Sellerie Equ'Attitud — site vitrine et console d'administration

Site de la Sellerie Equ'Attitud (Quimper) : site public (équitation, aménagement d'écurie, nouveautés, demande de devis en 5 étapes, contact) et console d'administration (`/admin`) pour gérer les devis, les messages et tout le contenu du site.

**Stack :** Next.js 16 (App Router) · React 19 · TypeScript (strict) · SQLite (better-sqlite3 + Drizzle ORM) · Zod · Vitest.

---

## Démarrage

Prérequis : Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env      # renseigner au minimum ADMIN_PASSWORD
npm run dev               # http://localhost:3000 — console : /admin
```

Au premier démarrage, la base SQLite est créée dans `storage/` avec le contenu par défaut, et le compte administrateur avec `ADMIN_PASSWORD` (ou un mot de passe généré, affiché dans la console du serveur).

### Reprendre les données de l'ancienne version (Express)

```bash
npm run import:legacy -- "/chemin/vers/ancien-site"
```

Importe `data/*.json` (contenu, devis, messages, statistiques, journal) et copie `uploads/`. Le mot de passe admin de l'ancien site reste valable.

## Scripts

| Commande                                           | Rôle                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                                      | Serveur de développement                                                 |
| `npm run build` / `npm start`                      | Build et serveur de production                                           |
| `npm run check`                                    | Typecheck + lint + tests (à lancer avant chaque livraison)               |
| `npm test`                                         | Tests unitaires et d'intégration (Vitest, SQLite en mémoire)             |
| `npm run db:generate`                              | Génère une migration après une modification de `src/server/db/schema.ts` |
| `npm run db:migrate`                               | Applique les migrations (aussi fait automatiquement au démarrage)        |
| `npm run db:studio`                                | Explorateur de la base (Drizzle Studio)                                  |
| `npm run admin:password -- "nouveau-mot-de-passe"` | Réinitialise le mot de passe admin                                       |
| `npm run import:legacy -- <dossier>`               | Import depuis l'ancienne version                                         |

## Architecture

```
src/
├── app/
│   ├── (site)/              Site public — layout racine, pages, 404
│   ├── (admin)/admin/
│   │   ├── (console)/       Console : connexion + pages protégées (app)/
│   │   └── (print)/         Document de devis imprimable (A4)
│   ├── api/                 Formulaires publics (contact, devis) et téléchargements admin
│   └── uploads/site/        Service des photos envoyées depuis la console
├── components/site|admin/   Composants React
├── content/blocks.ts        Registre des textes et images éditables du site
├── lib/                     Code pur partagé client/serveur (types, horaires, devis, formatage)
└── server/
    ├── db/                  Schéma Drizzle, connexion, contenu par défaut
    ├── repositories/        Seul accès à la base de données
    ├── services/            Fichiers, e-mails, médiathèque, sauvegardes
    ├── actions/             Server Actions de la console (toutes protégées)
    ├── queries/             Modèles de lecture des pages
    └── auth/                Mots de passe (scrypt) et sessions
drizzle/                     Migrations SQL versionnées
tests/                       Tests Vitest
scripts/                     Scripts CLI (import, migrations, mot de passe)
storage/                     Données d'exécution (base + photos) — non versionné
```

Principes :

- **Le site public est rendu côté serveur** à chaque requête depuis SQLite : le contenu modifié dans la console est visible immédiatement. Le design est celui de la version précédente, à l'identique (`src/styles/site.css`).
- **Une seule source de vérité pour le formulaire de devis** : `src/lib/quotes/definitions.ts` décrit chaque champ ; le formulaire public, le récapitulatif, la validation serveur et la fiche admin en dérivent.
- **Textes et images éditables** : `src/content/blocks.ts` déclare chaque bloc avec sa valeur par défaut ; la base ne stocke que les blocs modifiés. Pour rendre un nouveau texte éditable : l'ajouter au registre, puis l'utiliser via `loadTexts()` dans la page.
- **Sécurité** : chaque page, Server Action et route admin appelle `requireAdmin()` (les layouts seuls ne suffisent pas). Sessions en base (jeton haché), verrouillage après 5 échecs de connexion, entrées validées par Zod, type réel des fichiers vérifié à l'envoi, fichiers des devis privés, aucun HTML brut issu de la saisie (`src/lib/rich-text.tsx`).
- **Statistiques de visites anonymes** : compteur par jour et par page, sans cookie ni donnée personnelle.

## Configuration (`.env`)

Voir `.env.example`. Points importants :

- `DATA_DIR` : dossier de la base et des photos (`./storage` par défaut). **Doit être sur un disque persistant et sauvegardé.**
- `SITE_URL` : URL publique, nécessaire au `sitemap.xml`.
- `TRUST_PROXY=true` derrière un reverse proxy (nginx, Caddy, Cloudflare) pour que la limitation des tentatives de connexion utilise la vraie IP.
- `SMTP_*`, `MAIL_FROM`, `MAIL_TO` : notification par e-mail des demandes (facultatif, les demandes restent consultables dans la console).

## Mise en production

Hébergement Node.js avec disque persistant (VPS OVH / Scaleway / o2switch, Render avec disque, Railway…). Pas d'hébergement « serverless » (Vercel, Netlify) : SQLite et les photos ont besoin d'un disque.

```bash
npm ci
npm run build
PORT=3000 npm start                   # le port se règle par variable d'environnement, pas dans .env
```

Servir derrière HTTPS (le cookie de session est alors `Secure`), avec un gestionnaire de processus (systemd, pm2). Pour les mises à jour : `git pull && npm ci && npm run build` puis redémarrage ; les migrations s'appliquent au démarrage.

**Sauvegardes :** copier régulièrement le dossier `storage/` (base + photos). La console propose aussi un export JSON (Sauvegarde). Pour une copie à chaud cohérente de la base : `sqlite3 storage/equattitud.db ".backup backup.db"`.

## À compléter avant la mise en ligne

- **Mentions légales** : hébergeur, directeur de la publication, capital/RCS/TVA — modifiables dans la console (Pages, textes & visuels › Mentions légales).
