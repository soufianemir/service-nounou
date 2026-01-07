# CarnetNounou (Production Ready)

SaaS Next.js pour le carnet de liaison famille + nounou: planning, taches, journal, courses, alertes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (Supabase compatible)
- Auth email + mot de passe, session JWT en cookie HttpOnly
- PWA (manifest + icones)
- CSV import pour planning/taches/courses

## Demarrage local

Prerequis:
- Node.js 18+
- PostgreSQL/Supabase

1) Installer les dependances
```bash
npm install
```

2) Configurer l'environnement
- Copier `.env.example` vers `.env`
- Renseigner `DATABASE_URL` (pooler avec `pgbouncer=true`) + `SESSION_JWT_SECRET`

3) Creer le schema (Postgres)
```bash
npx prisma db push
```
Si ton `DATABASE_URL` pointe sur le pooler, utilise temporairement l'URL directe pour le `db push`.

4) Charger les donnees de demo
```bash
npm run seed
```

Comptes demo:
- Parent: `parent@demo.nounou` / `Demo1234!`
- Nounou: `nounou@demo.nounou` / `Demo1234!`

5) Lancer l'app
```bash
npm run dev
```

## Comptes fixes (Mir + Aurore)

Pour creer/mettre a jour les comptes demandes sans passer par l'inscription :
```bash
npm run accounts:mir
```

Cela cree un foyer "Famille Mir" si besoin et rattache la nounou.

## CSV import (planning, taches, courses)

Des modeles sont disponibles dans `public/templates/`:
- `tasks.csv` pour planning + taches
- `courses.csv` pour courses

Colonnes supportees:
- Taches: `title|titre|tache`, `description`, `date (YYYY-MM-DD)`, `time (HH:MM)`, `status`
- Courses: `label|libelle`, `qty`, `status`

## Deploiement Vercel + Supabase (gratuit)

1) Creer un projet Supabase, recuperer l'URL Postgres.
2) Dans Vercel -> Environment Variables:
   - `DATABASE_URL` (pooler Supabase avec `pgbouncer=true`)
   - `SESSION_JWT_SECRET` (long, random)
   - `SESSION_COOKIE_NAME` (ex: `cn_session`)
   - `SESSION_COOKIE_SECURE=true`
   - `NEXT_PUBLIC_BASE_URL` (URL Vercel)
3) Initialiser la base:
   - Option simple: `npx prisma db push` (une fois)
   - Option robuste: creer une migration puis `prisma migrate deploy`
4) Deploy sur Vercel.

### Deploiement CLI (script)

Le script `scripts/deploy-vercel-supabase.ps1` te guide et ne stocke pas les secrets.
Tu peux fournir `SUPABASE_DB_PASSWORD` et `VERCEL_TOKEN` dans l'environnement pour eviter les prompts.

Exemple:
```powershell
.\scripts\deploy-vercel-supabase.ps1 -ProjectName "Gestion" -SupabaseRef "cloxazniuqnqcbordvhd" -Seed
```

Optionnel:
- `-RuntimeDatabaseUrl` pour utiliser le pooler Supabase en runtime
- `-VercelScope` si ton projet est dans une team Vercel

Note: avec Prisma + pooler Supabase, ajoute `pgbouncer=true` au `DATABASE_URL` pour eviter les erreurs de prepared statements.

## Notes production

- Le stockage fichiers local est **desactive par defaut** (serverless). Si tu veux des pieces jointes, ajoute un storage externe (ex: Supabase Storage) et integre-le.
- L'import CSV cree les taches/courses en masse et rafraichit le planning.
