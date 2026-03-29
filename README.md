# Welcome to Voyagers project
# Genius Notes Hub (NoteForge) — AI Note Synthesizer

A modern web app to **merge class notes into master study guides using AI**. Upload PDFs/images/handwritten notes, then generate synthesized study material (study guides, flashcards, quizzes, etc.).

**“NoteForge — AI Note Synthesizer”**
The Problem We're Solving
Students often take unstructured, context-dependent notes during fast-paced lectures, which become difficult to understand over time. This leads to inefficient revision, where learners spend more time re-learning than reinforcing concepts.
Without intelligent note synthesis and automated study material generation, students waste precious time organizing and studying inefficiently, leading to:
 >Low knowledge retention rates
 >Reduced academic performance
 >Increased stress and burnout
 >Poor exam preparation

NoteForge solves this by transforming messy notes into structured, synthesized study materials—condensed summaries, flashcards, and quizzes—helping students reclaim study time and actually learn.
 What You Can Do
> Upload lecture notes (PDFs, images, handwritten, or text)
> Synthesize them into condensed study guides
> Generate flashcards automatically
> Create quizzes for self-assessment
> Study smarter with AI-powered learning tools


https://github.com/user-attachments/assets/9f9693bd-6858-4d4d-b7ec-f7692f90a654

---

## Tech Stack

- **Vite** (dev server runs on **port 8080**)
- **React 18 + TypeScript**
- **React Router** (routing)
- **@tanstack/react-query** (data fetching/caching)
- **Supabase** (`@supabase/supabase-js`) for backend services
- **Tailwind CSS** (+ `tailwindcss-animate`, typography plugin)
- **shadcn/ui + Radix UI** components
- **Vitest** (unit tests)
- **Playwright** (E2E testing setup present)

---

## Getting Started

### 1) Install dependencies

Using **npm**:
```bash
npm install
```

Or if you prefer **bun** (repo includes bun lockfiles):
```bash
bun install
```

### 2) Configure environment variables

Create a `.env` file in the root (or copy from your existing one) with:

```env
VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_KEY"
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
```

> Important: Don’t commit secrets. For Vite, only variables prefixed with `VITE_` are exposed to the client.

### 3) Run the dev server

```bash
npm run dev
```

Then open:
- http://localhost:8080

---

## Available Scripts

From `package.json`:

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run build:dev` — build using development mode
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint
- `npm run test` — run Vitest once
- `npm run test:watch` — watch mode Vitest

---

## Routing

Routes are defined in `src/App.tsx`:

- `/` → `src/pages/Index.tsx`
- `*` → `src/pages/NotFound.tsx`

---

## Supabase

This project uses Supabase via `@supabase/supabase-js`.

What you need:
1. A Supabase project
2. The **Project URL**
3. The **Publishable/Anon key**

Supabase local config is present under `supabase/` (including `supabase/config.toml`). If you use Supabase Edge Functions, they live in `supabase/functions`.

---

## Build & Deployment

### Build
```bash
npm run build
```

### Preview the build locally
```bash
npm run preview
```

Deploy the contents of `dist/` to any static hosting provider (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).  
Make sure to set the same `VITE_SUPABASE_*` environment variables in your hosting provider settings.

---

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit changes: `git commit -m "Add my change"`
4. Push: `git push origin feature/my-change`
5. Open a Pull Request

---


