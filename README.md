# BullCheck

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Lifehack25/BullCheck)

<img src="./src/lib/assets/horns.png" alt="BullCheck Logo" width="200" />

<br />

>**Solution is live at: https://bullcheck.pontus-dorsay.workers.dev/ ✨**

**Test Account**:

- **Username**: `cloudflare@gmail.com`
- **Password**: `CloudflareRocks123`

### **Statistics you can trust. No hallucinations, just data.**

**BullCheck** is a statistics-only question-answering system designed to combat misinformation by providing grounded, verifiable answers from official sources like Statistics Sweden (SCB).

Built as a showcase for a **Cloudflare Internship** application, this project demonstrates how to leverage the full [Cloudflare Developer Platform](https://developers.cloudflare.com/) to build high-performance, resilient, and truthful AI applications.

## ✨ Features

- **Edge-Native Performance**: Deployed globally on Cloudflare's edge network for <50ms latency.
- **Grounded Truth**: Unlike standard LLMs, BullCheck _never_ invents numbers. It retrieves real data from SCB and uses the LLM only for presentation.
- **Strictly Statistical**: A deterministic "SCB Specialist" agent filters out off-topic queries.
- **Transparent Sources**: Every answer is traceable to a specific SCB table.
- **Secure**: Built with privacy-first principles and secure authentication via [Better Auth](https://www.better-auth.com/).

## 🏗️ Infrastructure & Frameworks

This application was architected to demonstrate a deep understanding of the Cloudflare ecosystem, choosing components that offer the best balance of performance, consistency, and scalability for an AI-driven application.

### **Compute: Cloudflare Workers**

Selected for its **0ms cold start** and global distribution. Serving the SvelteKit app and API from the edge ensures the fastest possible Time-to-First-Byte (TTFB).

### **Frontend: SvelteKit (Svelte 5)**

Chosen for its ability to compile to highly efficient edge-ready code.

- **Runes**: Utilizes Svelte 5's fine-grained reactivity for a responsive UI.
- **Edge Adapter**: Seamless deployment via `@sveltejs/adapter-cloudflare`.

### **State: Durable Objects**

**Why?** AI agents need memory.
We use Durable Objects to serialize requests and manage the state of chat sessions. This ensures **strong consistency** and prevents race conditions when the agent is "thinking," a capability stateless functions lack.

### **Data Layer**

- **Cloudflare D1 (SQLite)**: Stores our curated index of SCB tables (`scb_tables`), allowing complex SQL queries at the edge.
- **Cloudflare KV**: Implements critical caching:
  - **Metadata Cache** (7-day TTL): Table definitions.
  - **Response Cache** (24-hour TTL): SCB API responses.

### **Intelligence**

- **Cloudflare AI Gateway**: Provides observability, caching, and rate limiting for LLM inference calls.

## 🛠 Tech Stack

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Auth**: [Better Auth](https://www.better-auth.com/)
- **Testing**: [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/Lifehack25/BullCheck.git
    cd BullCheck
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Configure environment:
    ```bash
    cp .env.example .env
    ```

### Local Development

1.  **Database Setup**:

    ```bash
    pnpm run db:generate
    pnpm run db:migrate
    ```

2.  **Start Dev Server**:

    ```bash
    pnpm run dev
    ```

    Access the app at `http://localhost:5173`.

3.  **Preview Worker**:
    ```bash
    pnpm run preview
    ```

## ⚙️ Configuration

The project is configured via `wrangler.jsonc` and uses the following bindings:

- `DB`: D1 database for the table index.
- `AI`: Cloudflare Workers AI binding.
- `BULLCHECK_AGENT`: Durable Object namespace for chat sessions.
- `SOURCE_METADATA_CACHE` / `SOURCE_RESPONSE_CACHE`: KV Namespaces.

## 📐 Architecture & Data Flow

### The "BullCheck" Pipeline

1.  **Orchestrator**: Classifies the prompt (DATA / REPHRASE / OFFTOPIC).
2.  **SCB Specialist**:
    - Searches D1 `scb_tables` index (see `seed.sql`).
    - Deterministically selects the best table.
    - Builds a valid SCB API v2 query.
3.  **Data Retrieval**: Checks KV cache -> Fetches from SCB -> Caches result.
4.  **Presentation**: LLM formats the _raw data_ into a natural language response.

## 📂 Project Structure

```
src/
├── lib/               # Shared utilities and components
├── routes/            # SvelteKit file-based routing
├── hooks.server.ts    # Server-side hooks (Auth, etc.)
└── worker.ts          # Worker entry point

drizzle/               # Database migrations
tests/                 # End-to-end tests
```

## 🧪 Testing

We use **Vitest** for unit testing and **Playwright** for end-to-end testing.

```bash
# Run unit tests
pnpm test

# Run End-to-End tests
pnpm test:e2e
```

---

## 📦 Deployment

Deploy to Cloudflare Workers with a single command:

```bash
pnpm run deploy
```

---

<p align="center">
  Built with ❤️ for the Cloudflare Team
</p>
