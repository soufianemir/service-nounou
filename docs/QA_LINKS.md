# QA Links

## Route inventory (app + api)
| route | type | auth | notes |
| --- | --- | --- | --- |
| / | page | public | Marketing landing |
| /connexion | page | public | Login form (POST /api/auth/login) |
| /inscription | page | public | Signup form (POST /api/auth/signup) |
| /contact | page | public | Contact/legal |
| /tarifs | page | public | Pricing |
| /cgu | page | public | Terms |
| /mentions-legales | page | public | Legal notice |
| /politique-confidentialite | page | public | Privacy |
| /notre-role | page | public | About |
| /cookies | page | public | Cookies |
| /app | page | session | Today dashboard (planning + tasks + courses) |
| /app/planning | page | session | Planning calendar |
| /app/taches | page | session | Tasks list |
| /app/journal | page | session | Journal list |
| /app/courses | page | session | Shopping list |
| /app/notifications | page | session | In-app notifications |
| /app/parametres | page | session | Account + employee onboarding |
| /api/auth/signup | api | public | Create household + user, redirect /app |
| /api/auth/login | api | public | Authenticate, redirect /app |
| /api/auth/logout | api | session | Clear session cookie, redirect / |
| /api/app/tasks | api | session | List/create tasks (POST parent only) |
| /api/app/tasks/[id] | api | session | Update/delete task (DELETE parent only) |
| /api/app/members/create-employee | api | session | Invite/create employee (parent only) |
| /api/app/schedule/exceptions | api | session | Manage exceptions (write parent only) |
| /api/app/schedule/weekly | api | session | Update weekly schedule (parent only) |

## Link inventory + mapping (menus, links, buttons)
| source | link/button | target | result | proof |
| --- | --- | --- | --- | --- |
| components/app/PublicHeader.tsx | CarnetNounou | / | OK | Playwright full run `npx.cmd playwright test --workers=1` |
| components/app/PublicHeader.tsx | Notre role | /notre-role | OK | Playwright full run |
| components/app/PublicHeader.tsx | Tarifs | /tarifs | OK | Playwright full run |
| components/app/PublicHeader.tsx | Contact | /contact | OK | Playwright full run |
| components/app/PublicHeader.tsx | CGU | /cgu | OK | Playwright full run |
| components/app/PublicHeader.tsx | Connexion | /connexion | OK | Playwright full run |
| components/app/PublicHeader.tsx | Commencer | /inscription | OK | Playwright full run |
| app/page.tsx | Commencer | /inscription | OK | Playwright full run |
| app/page.tsx | Se connecter | /connexion | OK | Playwright full run |
| app/page.tsx | Aller a l'app | /app | OK | Playwright full run |
| components/app/PublicFooter.tsx | Notre role | /notre-role | OK | Playwright full run |
| components/app/PublicFooter.tsx | Tarifs | /tarifs | OK | Playwright full run |
| components/app/PublicFooter.tsx | CGU | /cgu | OK | Playwright full run |
| components/app/PublicFooter.tsx | Mentions legales | /mentions-legales | OK | Playwright full run |
| components/app/PublicFooter.tsx | Confidentialite | /politique-confidentialite | OK | Playwright full run |
| components/app/PublicFooter.tsx | Cookies | /cookies | OK | Playwright full run |
| components/app/PublicFooter.tsx | Contact | /contact | OK | Playwright full run |
| app/connexion/page.tsx | Form submit | /api/auth/login | OK | Playwright full run |
| app/connexion/page.tsx | Creer un compte | /inscription | OK | Playwright full run |
| app/inscription/page.tsx | Form submit | /api/auth/signup | OK | Playwright full run |
| app/inscription/page.tsx | Se connecter | /connexion | OK | Playwright full run |
| components/app/AppShell.tsx | CarnetNounou | /app | OK | Playwright full run |
| components/app/AppShell.tsx | Deconnexion | /api/auth/logout | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Aujourd'hui | /app | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Planning | /app/planning | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Taches | /app/taches | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Journal | /app/journal | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Courses | /app/courses | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Alertes | /app/notifications | OK | Playwright full run |
| components/app/NavMobileClient.tsx | Reglages | /app/parametres | OK | Playwright full run |
| components/app/TodayDashboardClient.tsx | Voir le planning | /app/planning | OK | Playwright full run |
| app/notre-role/page.tsx | Parametres | /app/parametres | OK | Playwright full run |
| app/not-found.tsx | Aller a l'app | /app | OK | Playwright full run |
| app/not-found.tsx | Retour accueil | / | OK | Playwright full run |
| app/error.tsx | Retour a l'app | /app | OK | Playwright full run |

## Action buttons (no navigation)
| source | button | action | result | proof |
| --- | --- | --- | --- | --- |
| components/app/TodayDashboardClient.tsx | Fait/Rouvrir | Toggle task status | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Previous period | Change date range | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Next period | Change date range | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Jour/Semaine/Mois | Switch view | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Configurer/Enregistrer | Save weekly schedule | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Ajouter une plage | Create exception | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Modifier la journee | Replace exception | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Jour OFF | OFF exception | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | + Tache | Open task modal | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Creer | Create task | OK | Playwright full run |
| components/app/PlanningCalendarClient.tsx | Fait/Rouvrir | Toggle task status | OK | Playwright full run |
| components/app/InviteEmployeeCard.tsx | Creer le compte nounou | Invite employee | OK | Playwright full run |

## Proof command
- Build: `npm.cmd run build`
- Click-through + console/network checks: `npx.cmd playwright test --workers=1`