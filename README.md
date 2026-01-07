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
- PostgreSQL local ou Supabase

1) Installer les dependances
```bash
npm install
```

2) Configurer l'environnement
- Copier `.env.example` vers `.env`
- Renseigner `DATABASE_URL` et `SESSION_JWT_SECRET`

3) Creer le schema
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
   - `SESSION_JWT_SECRET` (long, random)
   - `SESSION_COOKIE_NAME` (ex: `cn_session`)
   - `SESSION_COOKIE_SECURE=true`
   - `NEXT_PUBLIC_BASE_URL` (URL Vercel)
3) Initialiser la base:
   - Option simple: `npx prisma db push` (une fois)
   - Option robuste: creer une migration puis `prisma migrate deploy`
4) Deploy sur Vercel.

## Notes production

- Le stockage fichiers local n'est pas adapte a Vercel. Utiliser un storage externe si besoin.
- L'import CSV cree les taches/courses en masse et rafraichit le planning.
