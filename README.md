# AutoBugFix (BugFlow AI)

AI Bug Detection & Management Platform — a full-stack developer tool combining AI-powered bug analysis, interactive Kanban-style bug tracking with priority triage, sprint/milestone planning, and a debugging lab for testing common security and structural code issues.

## Features

- **Issue Board** — Kanban board for filing, filtering, and transitioning bug tickets across a triage → diagnostics → QA → resolved pipeline
- **AI Automated Triage** — AI-generated severity/priority classification and root-cause analysis for incoming bugs
- **AI Crash Diagnostics** — paste console logs/stack traces and get an AI-generated root-cause explanation
- **AI Code Scanner** — OWASP-style security auditing of pasted source files
- **Sandbox / Debugging Lab** — side-by-side vulnerable vs. remediated code samples with AI deep-dive explanations
- **Sprint Planner** — sprints, milestones, and burndown tracking
- **Productivity AI** — generates PR templates, test scaffolding, and Conventional Commit messages
- **Multi-tenant orgs & teams** — organizations, teams, role-based access (super-admin/org-admin/developer/QA/PM)
- **Auth & sessions** — login, session/device list, Two-Factor authentication toggle

## Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Recharts, Framer Motion, Lucide icons
- **Backend:** Express 4 (TypeScript), running via `tsx` in development and bundled with `esbuild` for production
- **AI:** Google Gemini (`@google/genai`) — swappable behind a single client factory in `server.ts`

## Project Structure

```
.
├── api/               # Vercel serverless entry point (wraps the Express app)
│   └── index.ts
├── src/                # React frontend
│   ├── components/     # UI components (Issue Board, Sprint Planner, AI panels, Debugging Lab, ...)
│   ├── data/            # Static/sample data
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
├── server.ts           # Express app: REST API, AI integration, dev/prod bootstrap
├── vite.config.ts
├── vercel.json          # Vercel build/routing config
└── package.json
```

The backend keeps its data in memory (no database) — state resets whenever the server process restarts. This is intentional for a demo/reference app; see [Known Limitations](#known-limitations).

## Installation

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the example env file and set your AI provider API key:
   ```
   cp .env.example .env.local
   ```
   Then edit `.env.local` and set `AI_API_KEY` to your Gemini API key (see [Environment Variables](#environment-variables)).
3. Run the app in development mode:
   ```
   npm run dev
   ```
   The app serves both the API and the Vite-powered frontend from `http://localhost:3000`.

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Express + Vite middleware) on port 3000 |
| `npm run build` | Build the frontend (`vite build`) and bundle the server (`esbuild` → `dist/server.cjs`) |
| `npm start` | Run the production build (`node dist/server.cjs`) |
| `npm run preview` | Preview the built frontend with Vite's static preview server |
| `npm run lint` | Type-check the whole project (`tsc --noEmit`) |
| `npm run clean` | Remove build output |

## Environment Variables

See [`.env.example`](.env.example) for the full list. Copy it to `.env.local` (git-ignored) and fill in real values — do not commit secrets.

| Variable | Required | Description |
|---|---|---|
| `AI_API_KEY` | Yes, for AI features | API key for the AI provider (Gemini) used by the AI triage, diagnostics, code scanner, and productivity endpoints. Without it, those endpoints return a 500 error; the rest of the app works normally. |
| `APP_URL` | No | The public URL the app is hosted at, used for self-referential links. Optional locally. |

## API Documentation

All API routes are prefixed with `/api` and served by the Express app in `server.ts`. Selected endpoints:

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Log in with email/password |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/toggle-2fa` | Enable/disable two-factor auth |
| `GET` | `/api/bugs` | List bugs |
| `POST` | `/api/bugs` | Create a bug |
| `POST` | `/api/bugs/triage-ai` | AI-generated severity/priority triage for a bug |
| `POST` | `/api/bugs/:id/fix-ai` | AI-generated fix suggestion for a bug |
| `POST` | `/api/ai/diagnose-logs` | AI root-cause analysis from pasted console logs/stack traces |
| `POST` | `/api/ai/productivity-generator` | Generate PR templates / tests / commit messages |
| `POST` | `/api/analyze` | AI OWASP-style security scan of submitted source |
| `POST` | `/api/lab-explain` | AI deep-dive explanation for a Debugging Lab sample |
| `GET` | `/api/projects` / `/api/sprints` / `/api/teams` / `/api/orgs` | Project, sprint, team, and org data |
| `GET` | `/api/admin/audit-logs` | Audit log |

Full route list and request/response shapes are defined directly in `server.ts`.

## Deployment

### Vercel (frontend + API, recommended for this repo)

The repo is pre-configured for Vercel:
- `vercel.json` builds the frontend with `vite build` (served as static assets from `dist/`) and routes `/api/*` to the serverless function at `api/index.ts`, which wraps the same Express app used in development.
- Set the `AI_API_KEY` environment variable in the Vercel project settings (Project → Settings → Environment Variables).
- Because the backend keeps state in memory only, data does **not** persist across serverless invocations/cold starts on Vercel — see [Known Limitations](#known-limitations).

### Render / Railway / Fly.io (persistent Node process, recommended if you need in-memory state to persist across requests)

These platforms run `server.ts` as a normal long-lived Node process, which matches how it behaves in development:
1. Build command: `npm run build`
2. Start command: `npm start`
3. Set the `AI_API_KEY` environment variable in the platform's dashboard/secrets manager.
4. The app binds to `process.env.PORT` automatically (falling back to `3000` locally), matching what Render/Railway/Fly.io expect.

## Known Limitations

- **No real database.** All data (users, bugs, sprints, orgs, sessions) lives in in-memory arrays in `server.ts` and resets on every process restart. This is a demo/reference data layer, not production persistence.
- **Passwords stored in plaintext** in the in-memory user list — fine for a local demo, not acceptable for a real deployment without a real auth/database layer.
- **Not horizontally scalable** as-is: multiple server instances (e.g. multiple serverless invocations, or a multi-instance deployment) will not share state.
- **AI features require a valid `AI_API_KEY`**; without one, AI-dependent endpoints return HTTP 500 while the rest of the app still works.

## Future Improvements

- Replace in-memory arrays with a real database (Postgres/SQLite) and hashed password storage
- Add automated tests (unit + integration for the API routes)
- Code-split further and lazy-load heavy chart/AI components
- Add a provider-agnostic AI client interface so other model providers can be swapped in without touching route handlers

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
