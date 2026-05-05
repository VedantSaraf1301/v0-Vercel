# v0 Engine

A full-stack AI-powered UI generation platform inspired by [v0.dev](https://v0.dev). Type a prompt, get a live-rendered React component — built with a production-grade background job architecture using Inngest and isolated code execution via E2B sandboxes.

---

## What it does

The user types a natural language prompt (e.g. *"a dashboard with a sales chart and a user table"*). The app sends that prompt to **Google Gemini**, which generates React + Tailwind component code. That code is executed inside an isolated E2B cloud sandbox and the rendered output is streamed back — giving the user a **live preview and the source code side by side**, just like v0.dev.

All generation work is handled asynchronously via **Inngest** background jobs, so the HTTP request returns immediately and the UI updates in real time as the job progresses. Users can browse, revisit, and iterate on past generations — all persisted in the database.

---

## Architecture

```
User prompt
    │
    ▼
Next.js API Route
    │  triggers event
    ▼
Inngest Background Job
    │  calls AI model (streaming)
    ▼
Generated React + Tailwind code
    │  executed in
    ▼
E2B Cloud Sandbox  ──►  Live preview (iframe)
    │
    ▼
Result persisted to DB (Prisma + PostgreSQL)
    │
    ▼
TanStack Query polls / receives update → UI re-renders
```

**Why Inngest instead of a plain API route?**
AI generation can take 10–30 seconds. Handling it synchronously inside a serverless function risks timeout, gives no retry logic on failure, and blocks the client. Inngest decouples the trigger from the execution — the job runs reliably in the background with automatic retries, observable run history, and zero polling complexity on the server side.

**Why E2B for code execution?**
Generated code is untrusted by definition. Running it directly on the server would be a critical security vulnerability. E2B spins up an isolated micro-VM per execution, meaning malicious or broken code cannot affect the host environment. The sandbox is destroyed after each run.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Background jobs | Inngest + `@inngest/agent-kit` |
| Code sandbox | E2B |
| Database ORM | Prisma |
| Database | PostgreSQL |
| UI components | shadcn/ui + Radix UI |
| State management | TanStack Query v5 |
| Forms & validation | React Hook Form + Zod |
| Styling | Tailwind CSS v4 |
| AI model | Google Gemini |
| Rate limiting | rate-limiter-flexible |

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Accounts / API keys for: [Clerk](https://clerk.com), [Inngest](https://inngest.com), [E2B](https://e2b.dev), and an AI model provider (Google Gemini)

### 1. Clone and install

```bash
git clone https://github.com/VedantSaraf1301/v0-Vercel.git
cd v0-Vercel
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/v0engine"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# E2B
E2B_API_KEY=...

# Google Gemini
GEMINI_API_KEY=...
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run the development server

You need two processes running simultaneously — the Next.js app and the Inngest dev server.

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Inngest dev server (to receive background job events locally)
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.
Open [http://localhost:8288](http://localhost:8288) for the Inngest dashboard to inspect job runs.

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   └── inngest/        # Inngest function definitions
│   ├── (auth)/             # Clerk-protected routes
│   └── ...
├── components/             # shadcn/ui + custom components
└── lib/
    └── ...

prisma/
└── schema.prisma           # DB schema

sandbox-templates/
└── next-js/                # Custom E2B sandbox template for Next.js execution
```

---

## Key design decisions

**Sandbox template** — Rather than using a generic E2B sandbox, the project defines a custom `sandbox-templates/next-js` template pre-configured with the right Node version, dependencies, and file structure. This reduces cold start time and avoids dependency installation on every generation run.

**Rate limiting** — `rate-limiter-flexible` sits in front of the generation endpoint, preventing abuse without requiring a paid external service.

**Slug-based project IDs** — Projects use human-readable slugs generated via `random-word-slugs` rather than raw UUIDs, making URLs shareable and debuggable.

---

## License

MIT
