# Threadline

Threadline is organized as an npm workspace monorepo:

- `frontend/` — Next.js dashboard and authentication UI
- `backend/` — Express API, MongoDB data layer, authentication, and risk engine

## Requirements

- Node.js 20.9 or newer
- npm
- MongoDB Atlas or a local MongoDB server

## Run locally (macOS and Windows)

1. Copy `.env.example` to `.env` in the project root. Set `MONGODB_URI` to
   your MongoDB connection string and replace the development `JWT_SECRET`
   with a unique random value. The app creates/uses the database named by
   `MONGODB_DB` (defaults to `threadline`).
2. From the project root, install the workspace dependencies:

   ```sh
   npm install
   ```

3. Start both frontend and backend:

   ```sh
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The frontend runs on port 3000 and proxies `/api` requests to the Express API
on port 4000. If changing the backend port, set `BACKEND_PORT` in the root
`.env` and `BACKEND_URL` in `frontend/.env.local` (use
`frontend/.env.example` as a template). Configure `FRONTEND_URL` in the root
`.env` if the backend is called from a different origin.

At startup, the backend connects to MongoDB and creates indexes. It does not
seed sample users or synthetic login activity by default. The app stores data
in separate `users`, `login_events`, and `security_alerts` collections.

### Presentation demo

For a presentation, set `DEMO_MODE=true` in the root `.env`, then run:

```sh
npm run seed:demo
```

This creates or refreshes two demo logins and tagged simulated login events
and alerts. Demo events are shown in the dashboard only while `DEMO_MODE=true`;
they remain marked as simulated in MongoDB. Use these credentials:

| Username | Role | Password |
| --- | --- | --- |
| `demo-admin` | Admin | `ThreadlineDemo2026!` |
| `demo-analyst` | User | `ThreadlineDemo2026!` |

These are public presentation-only credentials. Do not enable demo mode or use
the seeded accounts in production. Existing records marked as simulated and
the built-in sample accounts remain excluded from normal dashboards. Ensure
the MongoDB Atlas network access list allows the machine running the app to
connect.

`GEMINI_API_KEY` is reserved for a future integration.

Run `npm run typecheck`, `npm run lint`, and `npm run build` from the root to
validate the workspaces and create production builds.
