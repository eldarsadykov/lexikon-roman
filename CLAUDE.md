# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Nuxt 4 website for *Lexikon-Roman* by Andreas Okopenko — an interactive hypertext novel structured as alphabetically-ordered encyclopedia entries (chapters) linked to one another. The site is deployed as a static site at `https://lexikonroman.at`.

## Commands

```bash
# Install dependencies
bun install

# Start dev server (also runs content generation first)
bun run dev

# Build for production (also runs content generation first)
bun run build

# Static site generation
bun run generate

# Lint
bun run lint

# Type checking
bun run typecheck

# Regenerate content/kapitel markdown files and route rules from Pug sources
bun run generate:content

# Regenerate route-rules only
bun run generate:route-rules
```

There are no tests. Always use `bun` (not `npm` or `yarn`).

## Architecture

### Content Pipeline

The core of the project is a **Pug → Markdown conversion pipeline** (`pug-to-md/`). The canonical chapter source files are in `pug-to-md/views/chapters/*.pug`; the pipeline converts them to `content/kapitel/*.md` for Nuxt Content to consume.

**Pipeline flow:**
1. `pug-to-md/meta/chapters.json` — master list of all chapters with `index`, `slug`, `links`, `articlesCount`, etc.
2. `pug-to-md/index.ts` — renders each `.pug` file to HTML, then post-processes it:
   - Rewrites `class="arrow"` → `class="arrow-link"`
   - Rewrites chapter hrefs (`foo.html` → `/kapitel/foo`, multi-part fragments → `/kapitel/foo/02`)
   - Rewrites image `src` paths (`../assets/img/foo.png` → `/img/foo`)
   - Extracts `<article>` HTML and embeds it directly in the markdown file body (not converted to Markdown — it stays as HTML)
3. `pug-to-md/redirects.ts` — generates `pug-to-md/generated/route-rules.ts` with 301 redirects for multi-part chapters (e.g. `/kapitel/foo` → `/kapitel/foo/01`)
4. Generated markdown frontmatter is produced from `chapters.json` via Zod schema (`schemas/index.ts`)

**Multi-part chapters:** When a chapter has `articlesCount > 1`, each `<article id="slug-N">` becomes a separate file at `content/kapitel/{chapter-dir}/01.md`, `02.md`, etc. A redirect is generated from `/kapitel/slug` to `/kapitel/slug/01`.

**Do not edit `content/kapitel/` directly** — those files are auto-generated. Edit the source `.pug` files in `pug-to-md/views/chapters/` and run `bun run generate:content`.

The generated HTML intermediate files land in `pug-to-md/generated/html/` (formatted by Prettier).

### Nuxt App Structure

- **`app/app.vue`** — root component; loads chapter navigation (for sidebar) and search sections; provides `navigation` globally via `inject/provide`
- **`app/layouts/chapters.vue`** — three-column layout (nav sidebar / content / right aside with theme toggle) used for chapter pages
- **`app/pages/index.vue`** — landing page, renders `content/index.md` via `ContentRenderer`
- **`app/pages/[...slug].vue`** — catch-all for other content pages (currently a stub)
- **`content.config.ts`** — defines three Nuxt Content collections: `landing` (index.md), `pages` (other top-level md), `chapters` (kapitel/**)
- **`schemas/index.ts`** — Zod schema for `ChapterMeta`; `schemas/slugs.ts` is an auto-generated enum of all valid slugs

### Key Config Details

- Site language is German (`lang="de"`)
- `nuxt-llms` exposes content for LLM access under `https://lexikonroman.at/`
- `nuxt-og-image` used for OG images; `LexikonRoman` is a custom OG image component
- `NUXT_PUBLIC_FREESOUND_API_TOKEN` env var enables ambient audio via Freesound API (see `useChapterAudio.ts`; currently disabled in app.vue)
- Route rules (redirects) are imported into `nuxt.config.ts` from the generated file at build time
- ESLint stylistic config: no comma dangle, `1tbs` brace style
