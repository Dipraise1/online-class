# Deploying Online Class to Vercel

The app is built and verified locally on SQLite. Production on Vercel needs:

1. **A Postgres database** (Vercel's serverless filesystem can't persist SQLite).
2. **Vercel Blob** for lecturer document uploads (ephemeral FS otherwise).
3. **Environment variables** set on the project.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | JWT signing secret (already generated below) |
| `BLOB_READ_WRITE_TOKEN` | Auto-set when you add a Vercel Blob store |

Generate a production secret (do **not** commit it — set it in Vercel only):

```bash
openssl rand -hex 32   # use the output as AUTH_SECRET
```

## Steps (Vercel Postgres + Blob)

1. In the Vercel dashboard → your project → **Storage**:
   - Create a **Postgres** (Neon) store → it injects `DATABASE_URL` / `POSTGRES_*`.
   - Create a **Blob** store → it injects `BLOB_READ_WRITE_TOKEN`.
2. Set `AUTH_SECRET` in **Settings → Environment Variables**.
3. Switch the Prisma datasource provider in `prisma/schema.prisma` to `postgresql`.
4. Deploy:
   ```bash
   vercel --prod
   ```
   The `build` script runs `prisma generate && prisma db push` automatically, so
   the schema is created on the production database on first deploy.
5. (Optional) Seed demo data:
   ```bash
   vercel env pull .env.production.local
   node scripts/seed.mjs
   ```

## Notes
- Local dev stays on SQLite (`prisma/schema.prisma` provider = `sqlite`) unless you
  point `DATABASE_URL` at Postgres and switch the provider.
- `build` uses `prisma db push` (not migrations) — simple and idempotent for an MVP.
