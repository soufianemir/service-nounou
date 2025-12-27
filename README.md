# CarnetNounou (MVP)

SaaS Next.js (App Router) — **carnet de liaison premium** entre **famille** et **nounou** :
planning & horaires, tâches, journal de journée (repas/sieste/changes/humeur/activités), courses, dépenses/justificatifs,
notifications internes + historique.

> Objectif produit : réduire la charge mentale des parents et garder une trace claire du quotidien.

## Stack

- Next.js + TypeScript + Tailwind
- Prisma + SQLite (fichier local)
- Auth : email + mot de passe, session JWT en cookie HttpOnly
- RBAC minimal : Parent / Employé (nounou)
- Logs d’audit (MVP) + export JSON

## Démarrage (local)

Pré-requis :
- Node.js 18+ (recommandé)
- npm

1) Installer les dépendances
```bash
npm install
```

2) Configurer l’environnement
- Copier `.env.example` vers `.env`
- Ajuster les valeurs si besoin

3) Initialiser la base (SQLite)
```bash
npx prisma generate
npx prisma db push
```

4) Injecter les **données de démonstration** (famille + nounou)
```bash
npm run db:seed
```

Comptes démo (local) :
- Parent : `parent@demo.nounou` / `Demo1234!`
- Nounou : `nounou@demo.nounou` / `Demo1234!`

5) Lancer l’app
```bash
npm run dev
```

## Routes principales

Public :
- `/` (home)
- `/notre-role`
- `/tarifs`
- `/cgu`
- `/mentions-legales`
- `/politique-confidentialite`
- `/cookies`
- `/contact`

Auth :
- `/connexion`
- `/inscription`

App (protégé) :
- `/app` (Aujourd’hui)
- `/app/taches`
- `/app/planning`
- `/app/journal`
- `/app/courses`
- `/app/notifications` (Alertes)
- `/app/parametres`

## Notes conformité (MVP)

- Les pages légales contiennent des placeholders à compléter avant mise en production.
- Les notifications sont **internes à l’app** (centre + badge).
  Pour des “vraies push” iOS/Android : la base est prête (PWA/wrapper), il faudra ajouter Web Push ou Capacitor Push (plus tard).
- Stockage fichiers (journal / justificatifs) : local (MVP). En production : chiffrement, contrôle d’accès, rétention, sauvegardes.
