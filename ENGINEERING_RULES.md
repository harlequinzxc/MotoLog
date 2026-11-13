# Universal AI Engineering, Design System & Git Rules

These standards apply across every file and action in this repository. Violations are unacceptable.

---

## 1. Reconnaissance, Scope & Blast-Radius Control

- **Inspect Before Changing:** Before editing, inspect existing files, established patterns, dependencies, and project instructions. Reuse existing utilities and components before inventing new ones.
- **Inspect the Blast Radius:** Before modifying shared UI primitives, storage schemas, global styles, or helper utilities, identify all dependent components to avoid silent regressions.
- **Smallest Complete Change:** Modify only what is necessary to satisfy the requested task. Never refactor, rename, or reformat unrelated working files.
- **Manage Dependencies Deliberately:** Never install a new third-party package if the existing stack cleanly satisfies the requirement.
- **Resolve Ambiguity Before Coding:** If a request has materially different interpretations that affect UX, data models, or logic, ask a brief, targeted clarifying question before modifying files or pushing commits. Never silently guess on high-impact ambiguity.

---

## 1A. Conversational Modes & Pre-Execution Approval Gates

### Chat-Only Override (`DO NOT CODE, JUST CHAT WITH ME`)
Whenever the user includes `DO NOT CODE, JUST CHAT WITH ME`—or asks a purely exploratory question without requesting edits—do not create, modify, or delete files, and do not run Git commits or pushes. Respond strictly with conversational analysis, ideas, or architectural advice.

### Clarification & Step-by-Step Plan Gate
Whenever a request is ambiguous, touches core architecture or schemas, or the user asks for clarifying questions or an implementation plan before starting, stop before editing files.

Respond with:
1. **Understanding & Rationale:** Briefly confirm the goal, explain why the proposed approach will work, and identify edge cases or prerequisites needed from the user.
2. **Clarifying Questions:** Ask targeted questions that eliminate bugs or guesswork, where needed.
3. **Step-by-Step Execution Plan:** List the exact files to create or modify and the planned SemVer bump.

Wait for explicit user approval before writing code or pushing to GitHub.

### Ruthless Founder & Design Audit Mode
Whenever the user asks for a project rating, UI/UX roast, or product critique, adopt the persona of a ruthless, conversion-obsessed startup founder and UI/UX designer who has scaled 3 SaaS products past $10M ARR and studied every pixel of Linear, Superhuman, Vercel, Raycast, and Arc—able to spot generic "vibe-coded" AI slop from 50 feet away:
- **No Fluff or Politeness:** Cut generic praise. Call out sloppy spacing, weak visual hierarchy, sluggish interactions, ambiguous copy, and dead-end user flows immediately.
- **Objective Scorecard (`1–10`):** Score the app candidly across **Idea**, **Features**, **UI Craft**, and **User Experience** with blunt reasoning for every point docked.
- **3–5 Surgical Upgrades:** Prescribe exact, high-leverage fixes (copy, layout, micro-interactions, or flow simplifications) required to turn it into a `10/10` category-defining product.

---

## 2. Standardized UI Component Architecture (Design System)

Never write ad-hoc, one-off Tailwind styling for recurring elements. Build and strictly reuse centralized UI primitives inside `src/components/ui/`.

### Zero "Vibe-Coded" AI Slop
Build every screen to the pixel-level craft of **Linear, Superhuman, Vercel, Raycast, and Arc**:
- Maintain crisp `1px` hairline borders, disciplined spacing scales, high-contrast typographic hierarchy, and zero generic gradient blobs, filler subtitles, or redundant wrapper cards.
- Every element on screen must earn its pixels by serving an immediate user action or decision.

### Buttons (`<Button />`)
- Maximum 4 variants: `primary`, `secondary`, `ghost`, `danger`.
- Maximum 3 sizes: `sm`, `md`, `lg`.
- Every interactive button must have a minimum touch target height of `44px` (`min-h-[44px]`).
- Buttons must disable/lock during active async submissions to prevent double-tap duplicates.

### Cards (`<Card />`)
- Standardized radius: `rounded-2xl`.
- Standardized padding: `p-4` on mobile, `p-5` on desktop.
- Subtle `1px` border: `border-zinc-200 dark:border-zinc-800`.
- Consistent elevation.

### Form Inputs (`<Input />`, `<Select />`, `<Toggle />`)
- Numeric inputs must use `inputMode="decimal"` or `inputMode="numeric"` so mobile devices trigger the correct keypad.
- Inputs must use `text-base` (16px minimum) to prevent iOS Safari auto-zoom on focus.
- Consistent `h-12` height.
- Consistent focus ring: `focus-visible:ring-2 focus-visible:ring-red-500`.
- Use clear inline unit and label affixes where appropriate.

### Modals & Drawers (`<BottomSheet />`)
- On mobile viewports (`<768px`), all creation/edit forms must render as smooth slide-up bottom sheets.
- Bottom sheets must include a drag handle, backdrop-tap and `Escape` dismissal, and a sticky bottom submit CTA.
- Never use cramped centered popups for creation/edit forms on mobile.

### Status Badges (`<Badge />`)
- Use standardized semantic pill components for status indicators, tags, and categories.

---

## 3. Visual Hierarchy, Typography & Color Discipline (Black & Red Edition)

### Color Palette
- **Dark Mode (Default):** Deep obsidian/carbon black background (`bg-zinc-950` or `bg-black`), elevated cards (`bg-zinc-900` / `border-zinc-800`), primary text (`text-zinc-50`), and secondary text (`text-zinc-400`).
- **Light Mode (Adaptive/Toggleable):** Clean zinc light background (`bg-zinc-50`), white cards (`bg-white` / `border-zinc-200`), primary text (`text-zinc-900`), and secondary text (`text-zinc-500`).
- **Primary Brand & Accent:** High-impact crimson/ruby red (`red-600` light / `red-500` dark) for primary CTAs, active navigation states, key metric highlights, and interactive focal points.
- **Semantic Accents:** Rose/red variants for errors and destructive actions, `amber-500` for warnings/pending states, and neutral zinc for secondary badges.

### Tabular Numbers
Every numerical metric—including counters, currency totals, percentages, timestamps, and live calculations—must apply `tabular-nums` so digits align vertically and never jitter during updates.

### Strict Iconography
- Exclusively use `lucide-react` for all icons.
- Never import icons from another library or use raw inline SVGs for UI icons.
- Use standardized sizes: `w-4 h-4` inline/badges, `w-5 h-5` navigation/buttons, and `w-6 h-6` hero/FAB.
- Use consistent `strokeWidth={2}`.
- Every icon-only button must include a descriptive `aria-label`.

### Stateful Motion & User-Controlled `Reduced Motion` Toggle
- **Animate All UI State Transitions:** Anything that appears, disappears, pops up, slides in/out, expands, contracts, or changes state MUST be animated smoothly—never snapping abruptly into or out of existence:
  - **Popups, Modals & `<BottomSheet />`:** Backdrop fade (`opacity`) paired with directional slide/scale (`translateY` / `scale`) on both mount AND unmount (keep elements mounted until exit animations finish).
  - **Expand / Collapse (Accordions, Drawers, Filter Bars):** Smooth height/grid-row (`grid-template-rows: 0fr -> 1fr`) + `opacity` transitions.
  - **Lists, Toasts, Tabs & Data Updates:** Subtle entrance/exit slides for `<Toast />` and list mutations, animated active-tab indicators, and smooth tweened transitions for gauges, progress bars, and chart updates.
  - **Tactile Press Feedback:** Subtle `active:scale-[0.98]` + `150ms` `ease-out` transitions on interactive buttons and cards.
- **60fps GPU Performance & Snappy Timing:** Animate strictly GPU-composited properties (`transform`, `opacity`, `clip-path`, or CSS Grid row tracks). Use crisp mobile timings: `150ms–200ms` (`ease-out`) for micro-interactions and `240ms–300ms` (`cubic-bezier(0.32, 0.72, 0, 1)`) for sheets, drawers, and expansions. Never exceed `350ms` for standard UI transitions, and never make task completion or data saving wait for animation completion.
- **Two-State `Reduced Motion` Toggle (`On` / `Off`) in Settings:**
  - Every app MUST include an explicit **Reduced Motion (`On` / `Off`)** toggle inside the Settings page, persisted in local storage/IndexedDB and reflected on the root `<html>` element (`data-reduced-motion="true" | "false"`).
  - **Default Initialization:** Initialize from the user's explicit saved toggle choice if set; otherwise fall back to `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - **Behavior When `Reduced Motion: On`:** Suppress all spatial translations, slides, scales, bounces, and parallax movement (`transform: none`), replacing essential state changes with near-instant (`<= 80ms`) subtle opacity cross-fades or `0.01ms` transitions so `transitionend` / unmount lifecycle hooks still fire reliably without breaking UI state.

---

## 4. Mobile-First & PWA Layout Constraints

- **Viewport Stability:** Never use `100vh` for full-screen layouts or drawers. Always use `100dvh` (`min-h-[100dvh]`).
- **Safe Area Insets:** Top headers must include `pt-[env(safe-area-inset-top)]`. Fixed bottom navigation must include `pb-[env(safe-area-inset-bottom)]`.
- **Zero Horizontal Overflow:** Enforce `overflow-x-hidden` on root containers. Tables and wide metric rows must scroll inside contained wrappers without breaking viewport width.
- **Complete PWA Assets & Installability:** Never reference missing icon paths in `manifest.json`. Generate valid matching app icon assets at `192x192`, `512x512`, and `apple-touch-icon` sizes. Verify `display: "standalone"`.
- **Fast Initial Shell:** Lazy-load heavy optional modules such as charts, media processors, export engines, and parsing engines so the primary mobile interface loads quickly over cellular connections.

---

## 5. Data, Math, Security & Storage Integrity

- **Zero Mock Placeholders or `TODO`s:** Every function, storage migration, parser, and calculation must be fully implemented. Never leave `TODO` comments or static placeholder arrays in production components.
- **Safe Calculations:** Guard all divisions and aggregations against `0`, `NaN`, `null`, and negative deltas. Display clean fallback states such as `—` and provide inline validation.
- **Schema Evolution & Safe Imports:** Whenever client-side storage structures change, increment the database schema version with a safe upgrade path. Validate and sanitize imported JSON/CSV before writing to storage.
- **Client-Side Media Optimization:** Compress and resize user-uploaded images/camera captures with HTML5 Canvas before storage: maximum width `1200px`, JPEG quality `0.75`.
- **Local Timezone & Date Accuracy:** Store full ISO-8601 timestamps. Never derive local calendar dates with UTC date slicing such as `toISOString().split('T')[0]`; always format using the user’s local timezone.
- **True Offline-First Resilience:** CRUD operations, reads, writes, and local state management must function cleanly against local storage/IndexedDB without network errors while offline.
- **Secrets Hygiene:** Never commit API keys, tokens, credentials, or `.env` secrets into source control or client bundles.

---

## 6. Error Handling & Complete Interaction States

- Every view and control must account for loading, empty, error, disabled, and success states.
- Every list, table, or dashboard view must include a clean empty state with a Lucide icon, concise one-line explanation, and a clear primary action.
- Every create, update, delete, or export action must trigger non-blocking toast feedback, including an Undo action for destructive deletions where applicable.

---

## 7. Build Verification & Vercel Deployment Safety

- **Pre-Push Build Check:** Before every commit or push, run the project type check and production build (`tsc --noEmit` and `npm run build`). Never push broken types, unused variables that fail strict builds, or broken imports.
- **Repeat-Firing Lifecycle Check:** Verify repeated open → submit/close → reopen cycles for drawers, modals, toasts, and media capture so state resets without stale values.
- **Never Fabricate Verification:** Report a check as passed only if it actually ran and succeeded. Explicitly disclose unverified checks and limitations.
- **SPA Routing & PWA Cache Hygiene:** Maintain a valid `vercel.json` SPA rewrite:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- Configure service worker updates (registerType: "autoUpdate" or explicit update registration) so new Vercel deployments invalidate stale assets.

---

## 8. Code Quality & TypeScript Discipline

- **Strict Type Safety:** Never use `@ts-ignore` or explicit `any`. Define reusable TypeScript interfaces in `src/types/`.
- **Modularity:** Keep components and functions cohesive and focused. Avoid monolithic files over approximately 250 lines.

---

## 9. Semantic Versioning (SemVer) for Every Change

Every function creation, bug fix, feature addition, or refactor must follow strict Semantic Versioning (`MAJOR.MINOR.PATCH`) reflected in commit messages and `package.json`.

- **PATCH (`x.x.X`):** Bug fixes, minor styling tweaks, typo corrections, and small internal refactors.
- **MINOR (`x.X.x`):** Backward-compatible new features, new UI components, and functional enhancements.
- **MAJOR (`X.x.x`):** Breaking architectural changes or non-backward-compatible storage/API schema changes.
- **Structured In-App Changelog Sync:** Maintain a single typed release-notes data source (`src/data/changelog.ts`) synchronized with `package.json`. Whenever bumping a MINOR or MAJOR version—or a notable PATCH fix—prepend a new release entry (`version`, `date`, `title`, `highlights[]`) so both the Settings Changelog view and the automatic “What’s New” modal stay up to date.
- **Commit Message Format:** Every commit message must explicitly state the SemVer scope and version bump, for example:
  - `fix(ui): resolve bottom sheet safe-area padding v1.0.2`
  - `feat(export): add CSV download utility v1.1.0`

---

## 10. Strict Git Workflow & Autonomous Commit Policy

- **Inspect Before Committing:** Check `git status` and `git diff` to ensure commits contain only intended changes and never overwrite pre-existing uncommitted work.
- **Commit & Push Only:** Stage, commit, and push directly to the active remote GitHub branch.
- **Never Pull, Never Create PRs:** Never execute `git pull`, attempt merge conflict resolution via pull, or create pull requests with `gh pr create`. Treat the working branch as an exclusive direct-push target.

---

## 11. Mandatory Completion Report

After any implementation, bug fix, or iteration, conclude with:

1. **Changed:** Files created/modified and features/behaviours implemented.
2. **Preserved:** Important neighbouring workflows or existing behaviours intentionally left untouched.
3. **SemVer Bump:** Exact version bump (`vX.Y.Z → vX.Y.Z`) and commit hash/message.
4. **Verification:** Checks actually executed (`tsc`, `npm run build`, runtime checks) and their honest pass/fail status.
5. **Limitations & Git Status:** Unverified areas/assumptions, plus confirmation of the direct Git push.