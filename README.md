# Online Class — University of Abuja

**Live demo → https://online-class-eosin.vercel.app**

A live‑video lecture platform for the University of Abuja (and any campus). Lecturers run
**live classes** (screen‑share, camera, host moderation), publish **materials**, set the
**schedule**, and take **attendance** — students join, learn, raise their hand, and get
marked present.

Built by **Divine Evna Olong**.

## Features

- **Live classroom** (LiveKit) — teacher shares screen / opens a doc with camera on; students
  join muted; the host can **mute anyone / mute all**; students **raise their hand** on the
  call; the host **passes attendance** as a pop‑up students toggle, with a live present count.
- **"Class hasn't started" gate** — students wait on a branded screen and auto‑join the moment
  the lecturer goes live.
- **Materials** — lecturers upload documents (stored on Vercel Blob); students download anytime.
- **Schedule** — class sessions with start/end times and online/physical mode.
- **Attendance** — joining a live class auto‑marks present; lecturers see the roll in real time.
- **Roles & auth** — lecturer / student accounts (bcrypt + JWT cookie).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma + Postgres (Neon) ·
Vercel Blob · LiveKit · deployed on Vercel.

## Local development

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, etc.
npx prisma db push            # create the schema
npm run seed                  # optional demo data

# in a second terminal, for live video:
livekit-server --dev          # ws://127.0.0.1:7880 (devkey/secret)

npm run dev                   # http://localhost:3000
```

## Deployment

See [DEPLOY.md](./DEPLOY.md). Production uses Neon Postgres, Vercel Blob, and LiveKit Cloud —
all configured via Vercel environment variables (never committed).

## Project structure

- `app/` — routes (landing, auth, dashboard, courses, live classroom, API routes)
- `components/` — `Classroom` (LiveKit UI), `Nav`, `AutoRefresh`
- `lib/` — `auth`, `prisma`, `livekit`, `storage`, server actions
- `prisma/schema.prisma` — data model
- `scripts/` — seeding and end‑to‑end test scripts
