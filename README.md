# CarnetNounou (Production Ready)

SaaS Next.js pour le carnet de liaison famille + nounou: planning, taches, journal, courses, alertes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (local) / PostgreSQL (production, Supabase compatible)
- Auth email + mot de passe, session JWT en cookie HttpOnly
- PWA (manifest + icones)
- CSV import pour planning/taches/courses

## Demarrage local

Prerequis:
- Node.js 18+
- SQLite local (par defaut) ou PostgreSQL/Supabase

1) Installer les dependances
```bash
npm install
```

2) Configurer l'environnement
- Copier `.env.example` vers `.env`
- Renseigner `DATABASE_URL` et `SESSION_JWT_SECRET`

3) Creer le schema (SQLite local)
```bash
npx prisma db push
```

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
   - `DATABASE_URL` (connection string Supabase)
   - `PRISMA_SCHEMA=prisma/schema.postgres.prisma`
   - `SESSION_JWT_SECRET` (long, random)
   - `SESSION_COOKIE_NAME` (ex: `cn_session`)
   - `SESSION_COOKIE_SECURE=true`
   - `NEXT_PUBLIC_BASE_URL` (URL Vercel)
3) Initialiser la base:
   - Option simple: `npx prisma db push --schema prisma/schema.postgres.prisma` (une fois)
   - Option robuste: creer une migration puis `prisma migrate deploy --schema prisma/schema.postgres.prisma`
4) Deploy sur Vercel.

### Deploiement CLI (script)

Le script `scripts/deploy-vercel-supabase.ps1` te guide et ne stocke pas les secrets.

Exemple:
```powershell
.\scripts\deploy-vercel-supabase.ps1 -ProjectName "Gestion" -SupabaseRef "cloxazniuqnqcbordvhd" -Seed
```

Optionnel:
- `-RuntimeDatabaseUrl` pour utiliser le pooler Supabase en runtime
- `-VercelScope` si ton projet est dans une team Vercel

## Notes production

- Le stockage fichiers local est **desactive par defaut** (serverless). Si tu veux des pieces jointes, ajoute un storage externe (ex: Supabase Storage) et integre-le.
- L'import CSV cree les taches/courses en masse et rafraichit le planning.
