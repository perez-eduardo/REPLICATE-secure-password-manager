# CLAUDE.md

Claude Code testing by Eduardo Perez
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Three independently deployed services that talk to each other over HTTP, plus a separate test workspace:

```
frontend/  React SPA (Vite, port 5173)         ── HTTP ──► backend
backend/   Express API (port 3001)             ◄── HTTP ── totp (internal routes)
totp/      TOTP/MFA microservice (port 4000)   ── HTTP ──► backend (internal routes)
tests/     Jest + supertest API tests          ── HTTP ──► backend + totp
```

Notable architectural choices:

- **TOTP is a stateless sibling service, not a backend module.** It owns no DB. It generates/verifies TOTP codes (via `speakeasy`) and reads/writes the user's `totpSecret` by calling the backend's `/api/internal/*` routes. Those internal routes are guarded by an `x-internal-secret` header (`TOTP_INTERNAL_SECRET`, shared between backend and totp). Frontend calls totp directly for `/totp/setup` and `/totp/verify`.

- **JWT is issued only after MFA, not at login.** `POST /api/auth/login` returns `{ requireMFASetup: true, userId }` on first login or `{ requireMFA: true, userId }` afterwards — no token. The token is minted inside the totp service's verifyMFA flow, which calls the backend's internal `POST /api/internal/users/:userId/complete-mfa` endpoint. Anything that needs a JWT in tests/scripts must go through that internal route (`tests/helpers.js::getJwt`).

- **Credentials are client-side encrypted; the server stores opaque blobs.** Frontend uses PBKDF2 (100k iterations, SHA-256) over the master password + per-record salt to derive a 256-bit AES key (`frontend/src/utils/crypto.js`). The backend persists only `{ ciphertext, iv, salt }` (base64) inside `Credential.encryptedData`. The server never sees plaintext credential data or the master password — do not add server-side fields that would require decryption.

## Lockout policy and rate-limit caveats

These two mechanisms overlap and trip each other in test/dev. Know which one is biting before "fixing" anything.

- **Account lockout** lives on the User document (`failedLoginAttempts`, `lockoutUntil` in `backend/models/User.js`) and is enforced in `backend/routes/authRoutes.js`:
  - 5 consecutive failed logins → `lockoutUntil = now + 15 min` and a 403 response (`"Account locked..."`). The counter is incremented with `$inc` to stay correct under concurrent attempts.
  - A successful login resets `failedLoginAttempts = 0` and `lockoutUntil = null`.
  - An expired `lockoutUntil` is also reset before re-checking the password, so a stale lock won't block a correct password forever.
  - To clear a locked test account, update the user doc directly in Mongo (`failedLoginAttempts: 0, lockoutUntil: null`) — there is no admin endpoint.

- **Rate limiters** live in `backend/server.js` (`express-rate-limit`, in-memory store, per-IP):
  - Global: 150 requests / 15 min on every route.
  - Auth: an additional 20 requests / 15 min on `/api/auth/*` only.
  - Returns 429 with standard `RateLimit-*` headers; legacy headers are off.
  - In-memory means **restarting the backend resets all counters** — fastest unblock during local dev.
  - Test suites that loop over login attempts (and CI re-runs) can blow the auth limit before they hit the lockout — a 429 here is NOT a lockout, and incrementing failed-attempt counters from a 429 path would be a bug.
  - The limiter sees `req.ip`. Behind a proxy/load balancer (EC2 deploy), set `app.set('trust proxy', ...)` if it isn't already, or every request will share one bucket.

- **Order of checks in login**: lockout → expired-lock reset → password compare → on-fail increment (and possibly relock) → on-success reset → MFA branch. Keep this order if you touch the route; flipping it can either skip the lock or double-count failures.

## Local development

Each service runs independently in its own folder; there is no root `package.json`.

```bash
# backend
cd backend && cp .env.example .env && npm install && npm run dev   # port 3001

# totp
cd totp && cp .env.example .env && npm install && npm run dev      # port 4000

# frontend
cd frontend && npm install && npm run dev                          # port 5173

# tests (requires backend + totp running)
cd tests && npm install && TOTP_INTERNAL_SECRET=<same-as-backend> npm test
```

The README quotes 5000/5001 for backend/totp but the code defaults and CI both use **3001/4000** — trust the code and CI.

Required backend env: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `TOTP_INTERNAL_SECRET` (server.js exits at startup if any is missing). `MONGO_TLS_CA_FILE` is only needed against DocumentDB. The `TOTP_INTERNAL_SECRET` value MUST be identical in backend and totp `.env` files or the totp service gets 403s from internal routes.

## Tests

- Tests live in their own workspace (`tests/`) and are integration-style — they hit real running services via supertest against `API_BASE_URL` / `TOTP_BASE_URL` (default `localhost:3001` / `localhost:4000`).
- `jest --runInBand` is intentional — tests share rate-limit budgets and a Mongo DB.
- `tests/helpers.js::getJwt` mints tokens via the internal route, bypassing TOTP. This is how credential/internal tests avoid the full MFA dance — do not "fix" it by going through the public login flow.
- Run a single file: `cd tests && npx jest auth.api.test.js`. Run a single test: `... -t "creates a new user"`.
- CI (`.github/workflows/api-tests.yml`) spins up Mongo via a service container, starts backend + totp in the background with hardcoded `test-*-for-ci-only` secrets, then runs the same `npm test`.

## Lint / build

- Frontend: `cd frontend && npm run lint` (ESLint flat config in `eslint.config.js`); `npm run build` produces a Vite bundle.
- No backend or totp lint config; no test script in their `package.json` (`npm test` in those folders is a no-op error).

## Deployment

Each push to `main` triggers per-path workflows (`.github/workflows/{backend,frontend,totp}.yml`) that run on **self-hosted EC2 runners** (labels `backend-ec2`, `frontend-ec2`, `totp-ec2`). Backend and totp deploys do `npm ci` then `sudo systemctl restart secure-password-manager-{backend,totp}`. Don't add steps that assume a hosted GitHub runner; don't expect the workflow to build on a PR.

## Conventions worth knowing

- Branch names: `feat/<firstname>-<topic>` (e.g. `feat/eduardo-36-clipboard-fallback`). Main is protected and requires 1 PR approval.
- Credential category is an enum on the schema: `personal | work | finance | social | other`. Changing it requires both a schema update and frontend filter changes in `Vault.jsx`.
- The Express body parser has a hard `100kb` limit — large encrypted payloads will 413.
