# RPM Auto Lab API

Backend for the customer portal + admin back-office. Deploys to Vercel as a
standalone project; the GH Pages marketing site (`src/`) calls it via CORS.

## Local dev

```sh
cd api
npm install
cp .env.example .env   # fill in real values
npx prisma generate
npm run dev
```

Hits http://localhost:3100. Point the frontend to it by setting
`NEXT_PUBLIC_API_BASE=http://localhost:3100` at the repo root before
running the root `next dev`.

## Deploy (first-time setup)

1. `cd api`
2. `vercel link` — point it at a new Vercel project.
3. Set env vars in the Vercel dashboard or via CLI:
   - `DATABASE_URL` — Neon Postgres URL (database `rpm_auto_lab`).
   - `SESSION_PASSWORD` — 32+ char random string for iron-session.
   - `WEB3FORMS_KEY` — access key from web3forms.com.
   - `ADMIN_EMAIL` — Alex's email; copy of every new-quote alert goes here.
   - `PUBLIC_ORIGIN` — `https://nradachy-web.github.io` (no trailing slash).
   - `BOOTSTRAP_TOKEN` — one-time secret used to create the first admin.
4. `vercel --prod` to deploy.
5. Bootstrap the admin account:

   ```sh
   curl -X POST https://<your-api>.vercel.app/api/admin/bootstrap \
     -H "Content-Type: application/json" \
     -d '{"token":"<BOOTSTRAP_TOKEN>","email":"alex@rpmautolab.com","password":"<strong-pw>","name":"Alex"}'
   ```

   Endpoint refuses to run a second time once an admin exists.

6. Back at the repo root, set `NEXT_PUBLIC_API_BASE=https://<your-api>.vercel.app`
   in the GH Pages build (repo → Settings → Secrets and variables → Actions →
   Variables), then re-run the deploy workflow.

## Routes

- `POST /api/auth/register` — customer signup
- `POST /api/auth/login` — login
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `POST /api/auth/set-password` — magic-link flow from quote submit email
- `POST /api/quotes/submit` — public endpoint (no auth) used by the marketing quote form
- `GET  /api/portal/dashboard` — customer overview
- `GET  /api/portal/jobs` — customer's jobs
- `GET  /api/portal/quotes` — customer's quotes
- `GET  /api/portal/vehicles` — customer's vehicles
- `GET  /api/admin/overview` — admin dashboard (requires role=admin)
- `POST /api/admin/jobs` — create a job (usually from a quote)
- `PATCH /api/admin/jobs/[id]/status` — advance job status + email customer
- `PATCH /api/admin/quotes/[id]` — update quoted amount/status
- `POST /api/admin/bootstrap` — one-time admin seed
- `GET  /api/health`
