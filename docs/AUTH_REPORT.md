# Authentication Report

_Generated: May 25, 2026_

## 1. Summary

Authentication is fully wired up using **Auth.js v5 (NextAuth)** with two
providers — email/password Credentials and Google OAuth — backed by
Postgres via Prisma. Sessions are JWT, password hashing is bcrypt
(12 rounds), and protected routes are gated through middleware on the
Edge runtime.

The implementation passes type-check and lint cleanly. No demo
accounts, hardcoded credentials, or mock auth data were found. The
admin dashboard still uses sample listing data (`app/(pages)/admin/components/data.ts`),
but that is unrelated to auth and is explicitly marked as such.

## 2. File map

### Core wiring

| File | Role |
|------|------|
| `auth.ts` | NextAuth instance — providers, `authorize`, Google `signIn` upsert callback. |
| `auth.config.ts` | Edge-safe slice (jwt/session callbacks, signin page). Imported by middleware. |
| `middleware.ts` | Route guard. Redirects unauthenticated users on `/admin`, `/profile`, `/checkout`; redirects logged-in users away from `/login`, `/register`; enforces `ADMIN` role on `/admin`. |
| `next-auth.d.ts` | Module augmentation: adds `id` and `role` to `Session.user` and `JWT`. |
| `app/api/auth/[...nextauth]/route.ts` | Catch-all exposing NextAuth handlers (`GET`/`POST`). |
| `app/api/auth/register/route.ts` | Custom signup endpoint (Zod-validated, rate-limited, origin-checked). |
| `app/CommonComponents/AuthSessionProvider.tsx` | Client `<SessionProvider>` mounted in root layout. |

### Server libraries (`lib/auth/`)

| File | Role |
|------|------|
| `passwords.ts` | `hashPassword` and constant-time `verifyPassword` (compares against a cached dummy hash on user-not-found to prevent timing-based enumeration). |
| `policy.ts` | Single source of truth for field limits, regexes, and `meetsPasswordPolicy`. Shared by client hooks and server schemas. |
| `schemas.ts` | Zod schemas: `registerSchema`, `loginSchema`, `passwordSchema`. |
| `rate-limit.ts` | In-memory fixed-window limiter with global persistence across hot reloads in dev. |
| `origin.ts` | Same-origin guard for hand-rolled POST endpoints (CSRF defense in depth). |
| `responses.ts` | Stable `jsonError` and `tooManyRequests` helpers (sets `Retry-After`). |

### Client (auth pages)

| Path | Role |
|------|------|
| `app/(auth)/login/` | Login page + small composable components (BrandPanel, FloatField, SocialButtons, etc.). |
| `app/(auth)/register/` | 3-step registration (Account → Security → Profile), password strength meter, terms checkbox, Google option. |

## 3. Authentication flows

### 3.1 Credentials sign-up

1. Client posts JSON to `POST /api/auth/register`.
2. Server enforces:
   - Origin allow-list (rejects cross-site POSTs).
   - `Content-Type: application/json`.
   - Per-IP rate limit: **8 attempts / 10 minutes**.
   - Zod parse against `registerSchema` (name, email, password, confirm,
     phone, city, `agreeToTerms === true`).
3. Password is bcrypt-hashed (12 rounds), user is `prisma.user.create`-ed
   with `termsAcceptedAt = now()`. Unique-email collisions return `409`.
4. Client auto-signs the user in via `signIn("credentials", …)` so the
   success screen shows a real session.

### 3.2 Credentials sign-in

1. Client calls `signIn("credentials", { email, password, redirect: false })`.
2. NextAuth `authorize` (in `auth.ts`):
   - Rejects passwords longer than 72 bytes before bcrypt sees them.
   - Parses with `loginSchema`.
   - Per-`IP+email` rate limit: **5 attempts / 5 minutes** — keyed on
     both so NAT users don't lock each other out, but single-account
     credential-stuffing still trips the bucket.
   - Looks up the user; runs bcrypt either way (dummy hash if no user)
     to keep timing roughly constant.
   - On match, returns `{ id, name, email, role }`. JWT/session
     callbacks promote `id` and `role` onto `token` and `session.user`.
3. The UI never reveals which side failed — every error shows the same
   generic message `"Invalid email or password. Please try again."`

### 3.3 Google OAuth

1. Client calls `signIn("google", { callbackUrl })`. NextAuth
   redirects to Google's consent screen with `prompt=select_account`
   so users can switch accounts.
2. After Google round-trip, the `signIn` callback in `auth.ts`:
   - Rejects sign-ins missing an email or whose `email_verified` is
     explicitly `false`.
   - Upserts `User` keyed on email — never overwrites a password set
     during Credentials signup; refreshes `name`/`image` only when
     Google actually provides them.
   - Mutates `user.id` / `user.role` so subsequent `jwt`/`session`
     callbacks see our DB values.
3. On any failure the upsert error is logged and `false` is returned,
   triggering NextAuth's AccessDenied page.

### 3.4 Session shape

JWT strategy. Every request that hits a session-aware route gets:

```ts
session.user = {
  id: string;
  role: "USER" | "ADMIN";
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
```

Augmented in `next-auth.d.ts`.

### 3.5 Route protection

Middleware (`middleware.ts`) runs on every non-static, non-`/api/auth`
request and applies these rules:

- **Already authenticated** users hitting `/login` or `/register` are
  bounced to `/`.
- Unauthenticated users hitting `/admin`, `/profile`, or `/checkout`
  are redirected to `/login?callbackUrl=…`.
- `/admin/**` additionally requires `role === "ADMIN"`. Non-admins are
  redirected to `/`.

## 4. Security properties

| Concern | Mitigation |
|---|---|
| Password storage | bcrypt @ 12 rounds. Hash never leaves the User record. |
| Long-password attack on bcrypt | Rejected at 72 bytes before bcrypt is called. |
| User enumeration via timing | Dummy bcrypt comparison on unknown user. |
| User enumeration via response | Single generic error message client-side. |
| Brute force / credential stuffing | Per-IP+email rate limit on login, per-IP on register. `Retry-After` on 429. |
| CSRF on Auth.js routes | Handled by Auth.js. |
| CSRF on custom register route | Origin check + `Content-Type` enforcement. |
| Terms acceptance | `agreeToTerms: z.literal(true)` server-side; `termsAcceptedAt` stamped at creation. |
| OAuth account hijack | Email-verified check; never overwrites stored password on Google upsert. |
| Double submit | Synchronous `useRef` guard on both register and login submits. |
| Session secrecy | `AUTH_SECRET` from env; JWT signed with it. |

## 5. Cleanup applied this pass

These were the only stale items found in auth-related code. No demo
users, mock sessions, or hardcoded credentials existed.

| File | Change |
|------|-------|
| `app/api/auth/register/route.ts` | Replaced deprecated `parsed.error.flatten()` with `z.flattenError(parsed.error)` (Zod v4 API). Stripped excess blank lines. |
| `app/(auth)/login/page.tsx` | Removed runs of stray blank lines. |
| `app/(auth)/login/components/LoginForm.tsx` | Reformatted destructured props onto separate lines; removed duplicate blank lines. |
| `app/(auth)/login/components/SocialButtons.tsx` | Removed dead blank lines around `handleGoogle`. |
| `app/(auth)/register/components/hooks.ts` | Removed unused `passwordValid`, `accountStepValid`, `securityStepValid`, `profileStepValid` from the returned object (no consumer uses them). Tidied imports and whitespace. |
| `app/(auth)/register/components/helpers.ts` | Removed unused `isValidEmail` export (the login version is the one in use). |
| `app/(auth)/register/components/FloatField.tsx` | Removed stray blank lines inside the function body. |

Verification: `tsc --noEmit` and ESLint run clean across the touched files.

## 6. Items NOT changed (and why)

- **`app/(pages)/admin/components/data.ts`** — clearly labeled "Demo
  data for the admin panel… Replace with API/database calls when
  backend is ready." Out of scope for auth, and removing it would break
  the dashboard before the real data layer lands.
- **`/login`'s `Forgot password?` link** — currently points back to
  `/login`. The flow isn't built yet. Left as-is rather than hiding it,
  since the placeholder is more discoverable for whoever picks the
  feature up.
- **In-memory rate limiter** — fine for single-instance deployments,
  but a multi-instance prod rollout will need a shared store
  (Upstash/Redis/Vercel KV). Already documented in `rate-limit.ts`.
- **Terms target pages** — checkbox links route to `/about`. Replace
  with real Terms / Privacy URLs when those pages exist.

## 7. Environment

Required env vars (see `.env.example`):

- `DATABASE_URL` — Postgres URL (Neon in current `.env`).
- `AUTH_SECRET` — JWT signing secret.
- `AUTH_URL` — public origin used by middleware and origin checks.
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth credentials.

Real secrets currently live in `.env`; `.env*` is gitignored.

## 8. Suggested follow-ups (non-blocking)

1. **Forgot-password / password-reset flow** — schema is ready (single
   nullable `password` column already supports OAuth-only users), just
   needs token issuance + email delivery.
2. **Email verification for Credentials sign-ups** — Google verifies
   email; Credentials currently does not.
3. **Move rate limiter to a shared store** before going multi-instance.
4. **Audit the `/admin/settings` and other admin pages** to ensure they
   read role from the session rather than trusting client state.
5. **Replace `/about` placeholder Terms/Privacy links** with real pages
   once content exists.
6. **Consider account lockout messaging** — currently a 429 from the
   server surfaces as the same generic "invalid credentials" text. A
   distinct "try again in N minutes" message (without leaking which
   account triggered it) would improve UX.
