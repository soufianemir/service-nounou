# Routes Inventory

| route | type | auth | methods | expected |
| --- | --- | --- | --- | --- |
| / | page | public | GET | Marketing landing page |
| /connexion | page | public | GET | Login form posts to /api/auth/login |
| /inscription | page | public | GET | Sign-up form posts to /api/auth/signup |
| /contact | page | public | GET | Contact/legal content |
| /tarifs | page | public | GET | Pricing content |
| /cgu | page | public | GET | Terms content |
| /mentions-legales | page | public | GET | Legal notice content |
| /politique-confidentialite | page | public | GET | Privacy policy content |
| /notre-role | page | public | GET | About/role explanation |
| /cookies | page | public | GET | Cookies policy content |
| /app | page | session | GET | Today dashboard (planning + tasks + courses) |
| /app/planning | page | session | GET | Planning calendar (requires session) |
| /app/taches | page | session | GET | Task list with due dates |
| /app/journal | page | session | GET | Journal entry list |
| /app/courses | page | session | GET | Shopping list items |
| /app/notifications | page | session | GET | In-app notifications list |
| /app/parametres | page | session | GET | Account info + employee onboarding (parent) |
| /api/auth/signup | api | public | POST | Create household + user, set session cookie, redirect /app |
| /api/auth/login | api | public | POST | Authenticate, set session cookie, redirect /app |
| /api/auth/logout | api | session | POST | Clear session cookie, redirect / |
| /api/app/tasks | api | session | GET, POST | List tasks or create task (POST parent only) |
| /api/app/tasks/[id] | api | session | PATCH, DELETE | Update or delete task (DELETE parent only) |
| /api/app/members/create-employee | api | session | POST | Invite/create employee (parent only) |
| /api/app/schedule/exceptions | api | session | GET, POST, PATCH, DELETE | Manage schedule exceptions (write parent only) |
| /api/app/schedule/weekly | api | session | POST | Update weekly schedule (parent only) |
