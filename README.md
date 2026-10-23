# DriveOKR - Modern OKR Management Platform

DriveOKR is a modern, user-friendly platform for managing Objectives and Key Results (OKRs). Built with React and Node.js, it provides a seamless experience for tracking organizational, departmental, and individual goals.

![DriveOKR Dashboard](placeholder-for-dashboard-screenshot.png)

## Features

- **Comprehensive OKR Management**
  - Create and track organizational, departmental, and individual OKRs
  - Real-time progress tracking
  - Confidence level indicators
  - Quarterly planning support

- **User-Friendly Interface**
  - Clean, modern design
  - Intuitive navigation
  - Progress visualization
  - Responsive layout for all devices

- **Authentication & Authorization**
  - Secure GitHub OAuth integration
  - Optional Google sign-in (OpenID Connect)
  - Role-based access control
  - JWT token authentication

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Vite
- Axios for API communication

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js for authentication

### DevOps
- Docker
- Docker Compose
- Nginx as reverse proxy

## Getting Started

### Prerequisites
- Node.js 24 LTS (24.15.0 or newer in the 24.x line; see `.nvmrc`)
- Docker and Docker Compose
- GitHub OAuth credentials
- Optional: Google OAuth client credentials (see [Google sign-in](#google-sign-in))

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/drive-okr.git
cd drive-okr
```

2. Create environment files from the templates and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`.env` files are git-ignored; never commit real secrets.

### Google sign-in

Google sign-in is optional. While `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
are empty (or still `your_google_...` placeholders) the "Sign in with Google"
button returns users to the landing page with a "not available" message, and
GitHub sign-in works as before.

1. In Google Cloud Console, open **APIs & Services → Credentials → Create
   credentials → OAuth client ID**, application type **Web application**.
   Configure the OAuth consent screen with only the `openid`, `profile` and
   `email` scopes (the app requests nothing else and never requests offline
   access).
2. **Authorized redirect URIs** — exactly `<BACKEND_URL>/api/auth/google/callback`,
   for local development `http://localhost:4000/api/auth/google/callback`.
3. **Authorized JavaScript origins** — not required (the browser never calls
   Google directly); if your console setup asks, use `<FRONTEND_URL>`, e.g.
   `http://localhost:3000`.
4. Put the credentials in `backend/.env` only (never in the frontend):

   ```
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   BACKEND_URL=http://localhost:4000
   FRONTEND_URL=http://localhost:3000
   ```

   `BACKEND_URL` and `FRONTEND_URL` must be bare http(s) origins. The OAuth
   callback and all post-login redirects are derived from them, never from the
   request.

How it works and security notes:

- Login CSRF protection: each sign-in gets a random `state`, sent to Google and
  set in an HttpOnly, SameSite=Lax cookie scoped to `/api/auth/google`. The
  callback must present the same state from the same browser within 10
  minutes, and each state works only once. Pending states are kept in backend
  memory, so a backend restart cancels in-progress sign-ins, and running several
  backend instances needs sticky routing for `/api/auth/google/*`.
- Google accounts are identified by Google's stable subject id (`googleId`).
  A verified email is required but is only stored for display. **Google and
  GitHub sign-ins are separate accounts**: a Google login is never linked to an
  existing GitHub account because the emails match, and new Google users always
  start as `individual` without admin rights. Promote them as described in
  [How to make a user an Admin](#how-to-make-a-user-an-admin), matching on
  `googleId` or `_id` rather than email, because two accounts may share an email.
- Google access and refresh tokens are not stored or logged.
- After sign-in the backend issues the same 7-day JWT used for GitHub.

#### Database migration for existing deployments (required once)

Databases created before Google sign-in have a unique, non-partial
`githubId_1` index on `users`. It allows only **one** user without a
`githubId`, so the second Google-only user would fail with
"Google sign-in is temporarily unavailable". Mongoose will not replace an
existing index, so run the migration once per database. It changes only the
`githubId_1` and `googleId_1` indexes and never modifies user documents:

```bash
cd backend
# 1. Back up the database first.
# 2. Dry run (default): prints the planned index changes and any blockers.
MONGODB_URI=<your-database-uri> node src/scripts/migrateUserProviderIndexes.js
# 3. Stop the backend, then apply:
MONGODB_URI=<your-database-uri> node src/scripts/migrateUserProviderIndexes.js --apply
# 4. Start the backend.
```

The migration refuses to run if existing data already has duplicate provider
ids. It is idempotent, and new databases need no migration. Between the
drop and the recreate of `githubId_1`, githubId uniqueness is briefly not
enforced, which is why the backend should be stopped while applying.

**If `--apply` fails partway** (for example `githubId_1` was dropped but the
new index could not be created), githubId uniqueness may no longer be
enforced. Do not restart the backend until the indexes are verified:

1. Keep the backend stopped.
2. Re-run the dry run. It lists any blockers, such as
   `N duplicated githubId value(s)`.
3. Investigate each reported duplicate with a read-only query, for example
   in `mongosh`:
   `db.users.aggregate([{ $match: { githubId: { $type: "string" } } }, { $group: { _id: "$githubId", ids: { $push: "$_id" }, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }])`
   (use `googleId` for Google duplicates). Decide case by case which record is
   the real account. Check its objectives, team and department references,
   role and admin flag, and take a backup before any change. Never delete
   users blindly.
4. Re-run the dry run until it reports no blockers, then run `--apply` again.
5. Verify the indexes before restarting. The dry run should print
   `Nothing to do; indexes already current.`, and `db.users.getIndexes()`
   should show `githubId_1` and `googleId_1` as `unique` with
   `partialFilterExpression: { <field>: { $type: "string" } }`.
6. Only then start the backend.

### Running with Docker

1. Start the application:
```bash
docker-compose up --build
```

2. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:4000`

## Verification

Use Node 24 LTS (`nvm use` if available), then install from the committed lockfiles:

```bash
(cd backend && npm ci && npm audit)
(cd frontend && npm ci && npm audit && npm test -- --run && npm run build)
```

Backend regression tests require a disposable MongoDB server, for example:

```bash
docker run --rm -d --name driveokr-test-mongo -p 127.0.0.1:27018:27017 mongo:8.2
cd backend
TEST_MONGODB_URI=mongodb://127.0.0.1:27018 npm test
# When finished:
docker stop driveokr-test-mongo
```

The API tests start their own backend on a free port, create a randomly named
`driveokr_test_*` database, and drop only that database on completion. They do
not run the destructive seed script or use real GitHub OAuth credentials. The
GitHub authorization redirect is checked, not a live GitHub sign-in.

Google sign-in tests run the real `passport-google-oauth20` code-exchange and
profile flow against a local fake provider (no network or Google credentials),
covering new and repeat users, state mismatch, replay, expiry and
cancellation, and email non-linking. The index migration is exercised on a
legacy-index fixture in a throwaway database. These tests are not a live Google
sign-in. Before relying on Google in an environment, do a manual smoke test with
a real OAuth client: sign in, cancel on the consent screen, and sign in again
as the same Google user.

`npm run dev` in the backend uses Node's built-in watch mode; Jest and nodemon
are no longer needed. CI repeats both audits, API and frontend tests, and the
production build on pull requests and pushes to main.

## Project Structure

```
drive-okr/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   └── ...
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Documentation

### Objectives

```
GET /api/objectives
GET /api/objectives/:id
POST /api/objectives
PUT /api/objectives/:id
```

### Key Results

```
GET /api/key-results/objective/:objectiveId
POST /api/key-results
PUT /api/key-results/:id
PATCH /api/key-results/:id/confidence
```

### How to make a user an Admin
```
docker ps
docker exec -it <container_id> bash
mongosh
use okr_platform
db.users.updateOne({email: "user@email.com"},{$set: {isAdmin: true}})
```
## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Tailwind CSS for the amazing utility-first CSS framework
- The React team for their excellent documentation
- MongoDB team for their robust database solution

## Contact

Stephen Pawulski - [@spops.bsky.social](https://twitter.com/spawulski) - spawulski@gmail.com

Project Link: [https://github.com/spawulski/drive-okr](https://github.com/spawulski/drive-okr)
