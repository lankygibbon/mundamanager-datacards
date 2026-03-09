# CLAUDE.md — mundamanager-datacards

## Project Overview
Necromunda gang cheat sheet that pulls fighter data from MundaManager (Supabase backend) and renders printable datacards.

## Branches
- `main` — legacy single-file vanilla HTML app, deployed to GitHub Pages
- `vue-migration` — active development, Vue 3 rewrite (not yet deployed)

## Tech Stack (Vue app)
- Vue 3 (Composition API, `<script setup>`)
- Vite — build tool, outputs to `docs/`
- Pinia — state management
- Vue Router — hash history (`createWebHashHistory`) required for GitHub Pages
- Supabase JS (`@supabase/supabase-js`) — auth + database
- Tailwind CSS v4 via `@tailwindcss/vite`
- VueUse — `useLocalStorage` and other composables
- html2canvas + jsPDF + Fabric.js — installed, not yet implemented

## Commands
```bash
npm run dev      # local dev server
npm run build    # builds to docs/
```

## GitHub Pages
- URL: https://lankygibbon.github.io/mundamanager-datacards/
- Source: `main` branch, `/docs` folder
- `docs/.nojekyll` must be preserved — `emptyOutDir: false` in vite.config.js handles this

## Project Structure
```
src/
  lib/
    supabase.js     # Supabase client (URL + anon key)
    rules.js        # RULES lookup, normaliseRuleName, getRuleDesc
  stores/
    auth.js         # login, logout, session init
    gang.js         # fetchGangs, fetchSheet (joins data client-side)
  router/
    index.js        # routes + auth guards
  views/
    LoginView.vue
    GangListView.vue
    SheetView.vue   # sheet header, fighter grid, rules reference, print
  components/
    FighterCard.vue # datacard — stats, weapons, wargear, skills, rules
  App.vue
  main.js
  style.css         # Tailwind import + CSS custom properties
docs/               # build output (committed for GitHub Pages)
cawdor-paths.json   # source data only — already inlined into rules.js
```

## Key Conventions

### Spacing & Styling
- Use **scoped CSS classes** for all spacing in components — Tailwind spacing utilities are unreliable in v4
- Tailwind structural utilities (flex, grid, gap, text size, colours) work fine
- CSS custom properties defined in `:root` in `style.css`

### FighterCard
- Each weapon gets its own `<table>` — do not attempt a single shared table across weapons (causes visual inconsistency)
- Do not use `<colgroup>` with `v-if` on `<col>` elements — unreliable in Vue
- Weapon name sits as a `.weapon-name-cell` div above each table, not as a row inside the table

### Vue Templates
- Do not call `window.*` inline in templates — assign to a function in `<script setup>` first
- `window.print()` must be wrapped: `function print() { window.print() }`

### Rules System
- `rulesMode` (localStorage): `'inline'` | `'reference'`
  - Inline: full descriptions on each card (special rules + skills + traits + wargear)
  - Reference: special rule name badges on card, full A→Z consolidated section at bottom
- In reference mode: badges/tags/traits are clickable → smooth scroll + highlight in reference section
- `getRuleDesc(name)` returns null if no description exists — always guard clicks with this check

### Auth
- Supabase JS client handles session persistence and token refresh natively — do not add manual localStorage token handling
- `auth.init()` called once in `App.vue` `onMounted`

### Print
- Print CSS in `SheetView.vue` scoped styles: single column, `break-inside: avoid` per card
- Rules reference uses `print:break-before-page` when in reference mode
