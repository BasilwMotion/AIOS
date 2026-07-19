# AIOS — AI Company OS

An autonomous "AI company" dashboard: a system of AI agents ("employees") organized into
departments, with a shared company brain, agent-to-agent messaging, a live task board, and
scheduled automation. Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**,
backed by **Supabase** (Postgres) and a pluggable **LLM** layer (Claude or free Gemini).

## Features

- **Dashboard** — company overview
- **Teams** — six departments → agent profiles (role, current task, tools, skills)
- **Agent profiles** — **live chat** (LLM), **private memory**, and an **inbox**
- **Brain** — **shared company memory** (every agent reads it) + a searchable wiki
- **Auto-summarization** — long chats are distilled into shared memory automatically
- **Messaging** — agents message each other; any message can **become a task**
- **Tasks** — a **live, drag-and-drop Kanban board** (create / move / delete, all persisted)
- **Automation** — schedule agents to run **daily / weekly / custom**, with **execution history**
- **Analytics** — live metrics from the database

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Purpose | Required |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | For memory / messages / tasks / automation |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (safe to expose) | same |
| `GEMINI_API_KEY` | Free Gemini key — the chatbot is the only thing that needs it | For anything AI |
| `AIOS_GEMINI_MODEL` | Gemini model (default `gemini-2.0-flash`) | Optional |
| `CRON_SECRET` | Locks the `/api/cron` endpoint | Optional (recommended in prod) |

Every feature **degrades gracefully** when its keys are missing — panels show a "connect it"
note instead of breaking.

## Database (Supabase)

The app expects these tables: `aios_shared_memory`, `aios_private_memory`, `aios_messages`,
`aios_tasks`, `aios_schedules`, `aios_job_runs`. Create them by running the SQL migrations in
your Supabase SQL editor (see the project history), or point at an existing AIOS database.

## Deploy to Vercel

1. Push to GitHub (Framework preset auto-detects **Next.js**).
2. Add the env vars above in **Settings → Environment Variables**.
3. **Node.js Version** → 24.x (pinned in `package.json`).
4. Deploy. The cron in `vercel.json` runs `/api/cron` once daily (Hobby plan limit — Pro
   allows finer schedules).

## Production notes / caveats

- **Auth & security:** this is a single-founder app with no login. Row-level-security policies
  are intentionally **permissive** (the publishable key has full access). Before exposing it
  publicly, add Supabase Auth and tighten the RLS policies.
- **Scheduling granularity:** Vercel Hobby crons fire **once per day**. Custom sub-daily
  intervals are stored and honored the moment the cron fires, but won't fire more often than
  the plan allows.
- **Scheduled-run duration:** each cron invocation runs due jobs sequentially within the
  function's `maxDuration` (60s). Many/long jobs may need a queue for real scale.
