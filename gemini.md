# BullCheck Project Documentation (`gemini.md`)

## Project Overview

**BullCheck** is a high-fidelity fact-checking application deployed on the Cloudflare Developer Platform. It combines an AI agent with rigid statistical data verification to provide clinical, unbiased answers.

- **Mission**: To answer user questions using _only_ strict data from trusted statistical databases, without moralizing or filtering.
- **Aesthetic**: Premium, dark/glassmorphism UI with fluid animations.

## Technology Stack

- **Framework**: SvelteKit (SSR + Client Hydration)
- **Deployment**: Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Authentication**: Better Auth (v1) with Drizzle Adapter
- **AI Model**: Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)
- **State Management**: Cloudflare Durable Objects (for conversational memory)
- **Styling**: Tailwind CSS v4

## Architecture

### 1. Hybrid Data Storage

The application uses a hybrid storage approach to separate "structured application data" from "chat state".

- **Cloudflare D1 (Global SQL)**:
  - Stores `User`, `Session`, `Account`, `Verification` (Better Auth tables).
  - Stores `Chat` metadata (`id`, `userId`, `title`, `updatedAt`).
  - Stores `Source` (statistical databases).
- **Durable Objects (`BullCheckAgent`)**:
  - Each chat session maps to a unique Durable Object instance.
  - **Internal Storage**: The DO uses its own local SQLite file (`this.ctx.storage.sql`) to store the actual stream of `messages` (role, content).
  - **Reasoning**: This provides infinite context window handling per-chat and isolates conversation state.

### 2. Authentication

- **Library**: Better Auth (`better-auth`).
- **Adapter**: Drizzle ORM (connected to D1).
- **Configuration**:
  - `src/lib/auth.ts`: Defines the auth configuration.
  - **Dynamic URL**: Accepts `baseURL` from the request environment (`env.BETTER_AUTH_URL`) to support both Localhost and Production without hardcoding.
  - **Strategies**: Email & Password.

### 3. The AI Agent (`src/lib/agent.ts`)

- **Class**: `BullCheckAgent` (extends `DurableObject`).
- **Personality**: "Clinical Data Analyst". Detached, professional, data-centric.
- **Flow**:
  1.  Receives POST `/chat` with user message.
  2.  Saves message to DO internal SQLite.
  3.  Retrieves full history.
  4.  Calls Cloudflare AI (Llama 3.3) with system prompt + history.
  5.  Streams response to client (Server-Sent Events) AND saves chunked response back to DO storage.

## Key Directories & Files

```
/
├── .svelte-kit/cloudflare/_worker.js  # Generated worker entry (patched by postbuild)
├── d1/                                # Migration files
├── scripts/
│   └── postbuild.js                   # CRITICAL: Appends DO export to worker build
├── src/
│   ├── lib/
│   │   ├── agent.ts                   # Durable Object Logic
│   │   ├── auth.ts                    # Better Auth Config
│   │   ├── server/db/schema.ts        # Drizzle D1 Schema
│   │   └── components/                # UI Components (Sidebar, etc)
│   ├── routes/
│   │   ├── +layout.server.ts          # Auth guards & Global Data
│   │   ├── login/                     # Login Page
│   │   ├── register/                  # Registration Page
│   │   └── api/auth/[...auth]/        # Auth API Endpoints
│   ├── app.d.ts                       # TypeScript Interfaces (Env, Locals)
│   └── worker-entry.ts                # (Likely unused/legacy if using adapter-generated worker)
├── drizzle.config.ts                  # Drizzle Kit Config
├── wrangler.jsonc                     # Cloudflare Config (Bindings, Secrets)
└── package.json                       # Dependencies & Scripts
```

## Deployment & Build

### The Build Problem (Fixed)

SvelteKit's `adapter-cloudflare` can sometimes strip unused exports, causing the `BullCheckAgent` class to be missing from the final worker bundle.

- **Solution**: A `postbuild` script (`scripts/postbuild.js`) runs after `vite build` to manually append `export { BullCheckAgent } ...` to the generated `_worker.js`.

### Commands

- **Local Dev**: `pnpm run dev` (Uses Vite/Miniflare).
- **Preview**: `pnpm run preview` (Builds & runs local worker simulation).
- **Deploy**: `pnpm run deploy` (Full build + secrets + upload).

### Production

- **URL**: `https://bullcheck.pontus-dorsay.workers.dev`
- **Env Vars**: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

## Current Status

- **Active**: Yes
- **Linting**: Clean (Prettier + ESLint passing).
- **Testing**: Basic flow verified manually.
