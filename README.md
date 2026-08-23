<div align="center">

# 🎨 PPTX.ai

**AI-powered presentation generator** — turn a few sentences into a polished, exportable PowerPoint deck in seconds.

Built with [TanStack Start](https://tanstack.com/start), React 19, and TypeScript.

</div>

---

## ✨ Features

- **Natural language → slides** — paste a prompt or topic and get a structured, well-designed deck generated automatically.
- **Templates** — one-click starter prompts (e.g. *pitch deck*, *product launch*, *strategy review*).
- **Fine-grained control** — choose the number of slides (3–20), visual **style**, **tone**, and **layout**.
- **AI-generated visuals** — each slide gets a bespoke illustration rendered by a diffusion model.
- **Slide editor** — review and edit titles, content, and speaker notes inline.
- **Presentation mode** — full-screen **slideshow** with a slideshow modal and full-screen slide stage.
- **Export to `.pptx`** — download a professionally styled, 16:9 PowerPoint file with embedded images and speaker notes.
- **Regenerate & manage** — regenerate a deck, update settings, or delete presentations from your library.
- **Secure auth** — GitHub & Google single sign-on via [Better Auth](https://better-auth.com).

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (full-stack React, file-based routing) |
| **UI** | React 19, [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (Base UI) |
| **Data fetching** | [TanStack Query](https://tanstack.com/query) + TanStack Router loaders |
| **Database** | PostgreSQL ([Neon](https://neon.tech)) via [Prisma](https://prisma.io) ORM |
| **Auth** | [better-auth](https://www.better-auth.com) (GitHub / Google) |
| **LLM** | [Groq](https://groq.com) (`openai/gpt-oss-120b`) |
| **Image generation** | [Cloudflare Workers AI](https://workers.cloudflare.com) (Flux 1 Schnell) |
| **Image storage/CDN** | [ImageKit](https://imagekit.io) |
| **Background jobs** | [Inngest](https://inngest.com) |
| **Export** | [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and `npm`
- A **PostgreSQL** database (e.g., [Neon](https://neon.tech)) — the project uses the `@prisma/adapter-pg` driver adapter.
- API keys for the AI/utility services used (see [Environment Variables](#-environment-variables)).

### 1. Install dependencies

```bash
npm install
```

> `npm install` runs `prisma generate` automatically (via `postinstall`) and generates the typed Prisma client into `src/generated/prisma`.

### 2. Configure environment

Copy the sample below into a local `.env` file (the file itself is gitignored — never commit real secrets):

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"

# Auth
BETTER_AUTH_SECRET="<a-long-random-secret>"
BETTER_AUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Inngest (background jobs)
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""

# ImageKit (image storage / CDN)
IMAGEKIT_PUBLIC_KEY=""
IMAGEKIT_PRIVATE_KEY=""
IMAGEKIT_URL=""

# Cloudflare Workers AI (image generation)
CLOUDFLARE_AI_API_KEY=""
CLOUDFLARE_AI_ACCOUNT_ID=""

# Groq (text generation)
GROQ_API_KEY=""
```

### 3. Sync the database schema

```bash
npx prisma migrate dev
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page — sign in with GitHub or Google to continue.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server on port **3000** |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview a production build |
| `npm run generate-routes` | Regenerate the TanStack Router route tree |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format (Prettier) + autofix lint issues |
| `npm run check` | Prettier check only |

---

## 🗂️ Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Secret used by better-auth (use a long random string) |
| `BETTER_AUTH_URL` | ✅ | Base URL of the app (e.g., `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | ⭕ | GitHub OAuth app credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ⭕ | Google OAuth client credentials |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | ✅ | Inngest keys for the background job |
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL` | ✅ | ImageKit keys for storing generated images |
| `CLOUDFLARE_AI_API_KEY` / `CLOUDFLARE_AI_ACCOUNT_ID` | ✅ | Cloudflare Workers AI to generate slide images |
| `GROQ_API_KEY` | ✅ | Groq API key used for slide *content* generation |

⭕ At least **one** social provider must be configured to sign in.

---

## 🗃️ Database Schema

The Prisma schema (`prisma/schema.prisma`) targets PostgreSQL and defines these models:

- **User** — app users (with email-verification state and avatar image).
- **Session / Account / Verification** — better-auth session and OAuth account tables.
- **Presentation** — a deck request: `title`, `prompt`, `slideCount`, `style`, `tone`, `layout`, and a `status` lifecycle (`DRAFT → GENERATING → COMPLETED / FAILED`).
- **Slide** — slides within a presentation: `title`, `content`, `notes`, `order`, `imageUrl`, `imagePrompt`.

A `Presentation` owns many `Slide`s (cascade delete). Ownership is enforced via `userId` on every query so users only ever see their own decks.

---

## ⚙️ How It Works

1. **Create** — The home page takes your prompt, slide count, style, tone, and layout and calls the `createPresentation` server function. The server creates a `Presentation` row (`GENERATING`) and kicks off a background job.
2. **Generate content** — A Groq `openai/gpt-oss-120b` call turns the prompt+settings into titled slides with content, speaker notes, and a detailed image prompt.
3. **Generate visuals** — For each slide, a **Cloudflare Flux 1 Schnell** image is generated and uploaded to **ImageKit** (CDN). Images are created sequentially with a short delay to respect rate limits.
4. **Poll & render** — The UI polls presentation status via TanStack Query and renders the finished deck.
5. **Edit & export** — Select a slide to edit it inline, play a **slideshow**, or hit **Download** to export a **16:9 `.pptx`** via PptxGenJS (background image + overlay + speaker notes).

Background work is orchestrated with **Inngest** via the `presentation/generate` event (see `src/integrations/inngest/`).

---

## 🧭 Project Structure

```
src/
├── components/          # Reusable UI (shadcn/ui) + auth components + navbar
├── features/            # Feature modules (feature-first architecture)
│   └── presentation/
│       ├── action/      # → Server Functions (create/update/delete/regenerate, list/get)
│       ├── components/  # slide cards, preview, stage, slideshow, generation status
│       ├── constant/    # options (styles, tones, layouts) & templates
│       ├── hooks/       # TanStack Query hooks + query keys
│       ├── lib/         # server-side helpers
│       ├── types/       # Zod schemas + TypeScript types
│       └── utils/       # export-to-pptx, thumbnail-url
├── integrations/        # Inngest (generate/image/function) & TanStack Query setup
├── lib/                 # db, auth, utils, auth.functions
├── middlewares/         # auth middleware (route + server fn guards)
├── providers/           # theme provider
└── routes/              # TanStack file-based routes & API endpoints
    ├── index.tsx                        # Home / create form
    ├── _auth/login.tsx                  # Sign-in
    ├── presentation.$presentationId.tsx # Deck editor
    └── api/{auth/$,inngest}.ts          # Auth + Inngest webhook
```

**Routing** is **file-based** with TanStack Router (tree generated in `src/routeTree.gen.ts`). Path aliases: `#/*` → `src/*` and `@/*` → `src/*`.

---

## 🛠️ Development

### Linting & Formatting

Uses **ESLint** (via the [TanStack ESLint config](https://tanstack.com/config/latest/docs/eslint)) and **Prettier**:

```bash
npm run lint     # lint
npm run format   # prettier --write . && eslint --fix
npm run check    # prettier --check .
```

### Database migrations

Never edit migrations by hand — create new ones:

```bash
npx prisma migrate dev --name <name>
```

The Prisma client is generated into `src/generated/prisma` (gitignored) and is regenerated on install and before build (`vercel.json` runs `prisma generate && npm run build`).

### Adding a route

Add a file under `src/routes/`, then regenerate the route tree:

```bash
npm run generate-routes
```

---

## ☁️ Deployment

The app targets **Vercel** (`vercel.json` sets the build command to `prisma generate && npm run build`). Configure all environment variables in your hosting provider, and ensure **Inngest** is set up to serve the `generate-presentation` function for background jobs.

