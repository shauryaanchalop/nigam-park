# Running & Deploying NIGAM-Park Without Lovable

This project is a normal Vite + React app with a Supabase backend. Nothing here
depends on Lovable at runtime. You can run it locally and host it yourself.

Two parts must be handled separately:

1. **Frontend** (this repo) — runs anywhere (local, Vercel, Netlify, GitHub Pages).
2. **Backend** (database, auth, edge functions) — currently hosted by Lovable Cloud.
   If it is paused, create your **own free Supabase project** and point the app at it.

---

## 1. Run the frontend locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build into dist/
npm run preview    # serve the production build
```

The app reads these variables from `.env` (already present):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

---

## 2. Create your own backend (Supabase, free tier)

1. Sign up at https://supabase.com and create a new project. Note the
   **Project URL**, **anon/publishable key**, and **project ref**.
2. Install the CLI: `npm i -g supabase` (or `npx supabase`).
3. Link and push the schema — all 30 migrations are in `supabase/migrations/`:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

4. Deploy the server functions in `supabase/functions/`:

```bash
supabase functions deploy demo-login --no-verify-jwt
supabase functions deploy vision-detect --no-verify-jwt
supabase functions deploy parking-assistant --no-verify-jwt
supabase functions deploy check-reservation-expiry --no-verify-jwt
supabase functions deploy generate-overstay-fines --no-verify-jwt
supabase functions deploy send-fraud-alert-email --no-verify-jwt
supabase functions deploy create-sensor-log
supabase functions deploy create-transaction
supabase functions deploy send-sms-notification
supabase functions deploy send-violation-notification
supabase functions deploy send-review-reply-notification
```

`supabase/config.toml` already records which functions skip JWT verification.

5. Function secrets (Supabase dashboard → Edge Functions → Secrets):

| Secret | Needed by | Where to get it |
| --- | --- | --- |
| `LOVABLE_API_KEY` | `vision-detect`, `parking-assistant` | Replace with your own AI provider key, or swap the endpoint to Google AI Studio / OpenAI |
| `RESEND_API_KEY` | email functions | resend.com (optional) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically by Supabase — do not set them yourself.

6. Enable **Email** sign-in under Authentication → Providers, and turn **off**
   "Confirm email" if you want demo logins to work instantly.

7. Put the new values in `.env` and `.env.production`, then rebuild.

### AI functions note
`vision-detect` and `parking-assistant` call `https://ai.gateway.lovable.dev`.
On your own backend, change that URL to Google Gemini
(`https://generativelanguage.googleapis.com/v1beta/openai/`) or OpenAI —
both accept the same OpenAI-style request body, so only the URL, key and model
name change.

---

## 3. Deploy the frontend

### Vercel
- Import the GitHub repo. Framework: **Vite**, build `npm run build`, output `dist`.
- Add the three `VITE_*` variables under Settings → Environment Variables.
- `vercel.json` already contains the SPA rewrite so deep links work.

### Netlify
- Build `npm run build`, publish directory `dist`.
- `public/_redirects` already has `/* /index.html 200`.

### Any static host / your own server
```bash
npm run build
npx serve dist        # or copy dist/ to nginx, Apache, S3, etc.
```
Nginx SPA rule:
```
location / { try_files $uri $uri/ /index.html; }
```

---

## 4. Fully offline / local backend (optional)

You can run Supabase itself on your laptop with Docker — useful for a demo with
no internet:

```bash
supabase start          # starts Postgres, Auth, Storage locally
supabase db reset       # applies every migration in supabase/migrations
```

Then set:
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key printed by supabase start>
```

---

## Checklist before a demo
- [ ] `npm run build` succeeds
- [ ] `.env` points to a **running** backend
- [ ] Migrations pushed, functions deployed
- [ ] Email auth enabled, confirmation off
- [ ] Demo login works for admin / attendant / citizen
