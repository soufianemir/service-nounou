# QA Report

## Summary
- Routes inventory generated in docs/ROUTES.md.
- Build and typecheck pass. Lint could not run due to interactive Next.js prompt.
- Playwright smoke test passes (pages + APIs).
- Playwright exhaustive UI test passes (parent + nounou).
- Playwright full suite passes (smoke + exhaustive) when run sequentially (--workers=1).
- /app is the Today dashboard (planning + tasks + courses); /app/planning remains calendar view.

## Environment
- Local env file created: .env (copied from .env.example).
- Database: SQLite at data/app.db.

## Static checks
- npm.cmd ci
  - Result: added 149 packages, audited 150 packages, 0 vulnerabilities.
- npx.cmd prisma validate
  - Result: The schema at prisma/schema.prisma is valid.
- npx.cmd prisma generate
  - Result: Generated Prisma Client (v6.19.1) to node_modules/@prisma/client.
- npm.cmd run prisma:push
  - Result: Error: Schema engine error (with DATABASE_URL=file:./data/app.db).
- DATABASE_URL=file:C:\Users\s.mir\Projects\service-nounou_v2\data\app.db npx.cmd prisma db push --skip-generate
  - Result: Your database is now in sync with your Prisma schema.
- npm.cmd run lint
  - Result: Next.js prompts for ESLint config selection (interactive), lint not executed.
- npx.cmd tsc --noEmit
  - Result: pass.
- npm.cmd run build
  - Result: build succeeds, static pages generated.

## Execution + smoke
- Playwright (Chromium) smoke test:
  - Command: $env:PLAYWRIGHT_PORT='3003'; npx.cmd playwright test
  - Result: 1 passed.

## Execution + exhaustive UI
- Playwright exhaustive UI test:
  - Command: $env:PLAYWRIGHT_PORT='3004'; npx.cmd playwright test tests/ui-exhaustive.spec.ts
  - Result: 1 passed.
  - Coverage: all public pages, all /app pages, theme toggle, nav links, day/week/month views (including day grid buttons), schedule editor, exceptions modal (add/modify/delete), tasks modal (create/cancel), task status toggle, logout/login for parent and nounou.

## Execution + full suite
- Playwright full suite (sequential):
  - Command: $env:PLAYWRIGHT_PORT='3004'; npx.cmd playwright test --workers=1
  - Result: 2 passed.

## Reported runtime errors (user logs)
- Command: next start (reported during runtime; likely without a fresh build)
- Logs:
  - at <unknown> (C:\Users\s.mir\Projects\service-nounou_v2\.next\server\app\app\parametres\page.js:2:7687)
  - at Object.<anonymous> (C:\Users\s.mir\Projects\service-nounou_v2\.next\server\app\app\parametres\page.js:2:7752) {
    code: 'MODULE_NOT_FOUND',
    requireStack: [Array],
    page: '/app/parametres'
  }
  - [Error: ENOENT: no such file or directory, open 'C:\Users\s.mir\Projects\service-nounou_v2\.next\routes-manifest.json'] {
    errno: -4058,
    code: 'ENOENT',
    syscall: 'open',
    path: 'C:\\Users\\s.mir\\Projects\\service-nounou_v2\\.next\\routes-manifest.json',
    page: '/app/courses'
  }
  - [Error: ENOENT: no such file or directory, open 'C:\Users\s.mir\Projects\service-nounou_v2\.next\routes-manifest.json'] {
    errno: -4058,
    code: 'ENOENT',
    syscall: 'open',
    path: 'C:\\Users\\s.mir\\Projects\\service-nounou_v2\\.next\\routes-manifest.json'
  }
  - [Error: ENOENT: no such file or directory, open 'C:\Users\s.mir\Projects\service-nounou_v2\.next\routes-manifest.json'] {
    errno: -4058,
    code: 'ENOENT',
    syscall: 'open',
    path: 'C:\\Users\\s.mir\\Projects\\service-nounou_v2\\.next\\routes-manifest.json'
  }
  - [Error: ENOENT: no such file or directory, open 'C:\Users\s.mir\Projects\service-nounou_v2\.next\routes-manifest.json'] {
    errno: -4058,
    code: 'ENOENT',
    syscall: 'open',
    path: 'C:\\Users\\s.mir\\Projects\\service-nounou_v2\\.next\\routes-manifest.json',
    page: '/app/courses'
  }
  - [Error: ENOENT: no such file or directory, open 'C:\Users\s.mir\Projects\service-nounou_v2\.next\routes-manifest.json'] {
    errno: -4058,
    code: 'ENOENT',
    syscall: 'open',
    path: 'C:\\Users\\s.mir\\Projects\\service-nounou_v2\\.next\\routes-manifest.json'
  }
- Probable cause: next start was run without a fresh next build, so .next outputs were missing or stale.

## Routes tested (Playwright)
Pages:
- / (200)
- /connexion (200)
- /inscription (200)
- /contact (200)
- /tarifs (200)
- /cgu (200)
- /mentions-legales (200)
- /politique-confidentialite (200)
- /notre-role (200)
- /cookies (200)
- /app (200)
- /app/planning (200)
- /app/taches (200)
- /app/journal (200)
- /app/courses (200)
- /app/parametres (200)
- /app/notifications (200)

API:
- POST /api/auth/signup (via form submit) -> 302 to /app
- POST /api/auth/login -> 302
- POST /api/auth/logout -> 302
- GET /api/app/tasks -> 200
- POST /api/app/tasks -> 201
- PATCH /api/app/tasks/:id -> 200
- DELETE /api/app/tasks/:id -> 200
- POST /api/app/members/create-employee -> 200
- GET /api/app/schedule/exceptions -> 200
- POST /api/app/schedule/weekly -> 200
- POST /api/app/schedule/exceptions -> 200
- PATCH /api/app/schedule/exceptions -> 200
- DELETE /api/app/schedule/exceptions?id=... -> 200

## Fixes applied (Symptom -> Root cause -> Fix -> Proof)

1) Auth validation and password compare mismatches
- Symptom: Typecheck/build errors: missing exports loginSchema/signUpSchema and comparePassword.
- Root cause: lib/validations exports LoginSchema/SignupSchema; lib/auth exports verifyPassword, not comparePassword.
- Fix: Export lower-case aliases and adjust schema fields to match form (name/email/password). Update login route to use verifyPassword.
- Proof: npx.cmd tsc --noEmit (pass); npm.cmd run build (success).

2) Next.js route handler context typing
- Symptom: next build failed with ParamCheck RouteContext error in app/api/app/tasks/[id]/route.ts.
- Root cause: Next 15 expects ctx.params to be a Promise in generated types.
- Fix: Change ctx param type to Promise<{ id: string }> and await it before use.
- Proof: npm.cmd run build (success).

3) Button/Badge prop variants and sizes
- Symptom: Type errors for Button size/variant (outline/default) and Badge variant (secondary/default).
- Root cause: UI components only allowed limited variant/size types.
- Fix: Extend Button variants/sizes, adjust Badge usage to existing variants (muted/outline).
- Proof: npx.cmd tsc --noEmit (pass).

4) PlanningCalendar day segment handling
- Symptom: Type errors where computeWorkSegmentsForDate result was treated as array.
- Root cause: function returns { segments, off } but code used it as array.
- Fix: Use .segments in PlanningCalendarClient (daySegments and per-day calculations).
- Proof: npx.cmd tsc --noEmit (pass).

5) Reveal component JSX namespace
- Symptom: Type error: Cannot find namespace JSX.
- Root cause: React Element type declared as keyof JSX.IntrinsicElements in a client file without JSX namespace.
- Fix: Use React.ElementType for the as prop.
- Proof: npx.cmd tsc --noEmit (pass).

6) Missing /app and navigation subroutes
- Symptom: "Aujourd'hui" duplicated Planning; /app had no day dashboard and subroutes showed WIP placeholders.
- Root cause: /app redirected to /app/planning; missing content pages.
- Fix: Implement /app as Today dashboard using existing planning/tasks/courses data; implement real list pages for taches/journal/courses/notifications/parametres.
- Proof: npm.cmd run build (success); Playwright exhaustive UI test passes.

7) Planning date navigation accessibility
- Symptom: Prev/next buttons lacked accessible labels (hard to target and not screen-reader friendly).
- Root cause: Buttons relied on icon text only.
- Fix: Add aria-labels for previous/next period.
- Proof: npm.cmd run build (success); Playwright exhaustive UI test passes.

8) Runtime missing build artifacts
- Symptom: next start logs reported MODULE_NOT_FOUND for /app/parametres and ENOENT for .next/routes-manifest.json.
- Root cause: start was executed without a fresh build or with stale .next output.
- Fix: run npm.cmd run build before npm.cmd run start to regenerate .next.
- Proof: npm.cmd run build (success); .next/routes-manifest.json present; Playwright full run passes.

## Business processes
Executed end-to-end:
- Parent signup + session creation -> access /app/planning.
- Today dashboard view (planning segments + tasks + courses).
- Weekly schedule update (base schedule edit + save).
- Exception lifecycle (add + modify + delete + OFF cycle).
- Task lifecycle (create + toggle done + reopen).
- Employee invite (API) -> nounou login -> task marked done.

Remaining to control (not implemented or no UI yet):
- Journal entry creation/editing (read-only list exists, no create/edit UI).
- Shopping list items (read-only list exists, no create/edit UI).
- Notifications list/read/clear (read-only list exists, no clear UI).
- Approvals flow (no UI).
- Expenses flow (no UI).
- Task deletion (no UI action; API only).
- Employee management beyond create (no UI).

## Test harness notes
- Playwright configured to use dynamic PORT via PLAYWRIGHT_PORT to avoid port collisions.
- Request failure guard ignores net::ERR_ABORTED for RSC, document navigations, and /connexion?next redirects (prefetch/redirect artifacts).
