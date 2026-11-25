# Who Gifts Who Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single-device gift-exchange draw SPA for a year-end party: enter participants and couples, draw a valid assignment (nobody gets themselves or their partner), then reveal each result on a big screen with a gift-box animation.

**Architecture:** Pure TypeScript core (draw algorithm, reducer, validation, storage) with unit tests, wrapped by a thin React UI driven by one `useReducer` state machine with four phases (`setup → board ⇄ reveal → summary`). State is persisted whole to `localStorage`. Static build is hosted on GitHub Pages with a precaching service worker for offline refresh.

**Tech Stack:** Vite, React, TypeScript (strict), `motion` (`motion/react`), `@fontsource/mali`, `vite-plugin-pwa`, Vitest, npm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-25-who-gifts-who-design.md` (Thai). Visual reference: `.superpowers/brainstorm/15744-1795613587/content/reveal-style.html`, the `.gift` section.

## Global Constraints

- **No `git commit` / `git push` unless the user explicitly asks** (user preference overrides this skill's commit steps). Where a task ends, stop at "verify" and report; do not commit. The project is not yet a git repo; do not `git init` without asking.
- npm only. Scripts: `npm test` = `vitest run`, `npm run typecheck` = `tsc -b`, `npm run build` = `tsc -b && vite build`.
- Runtime dependencies allowed: `react`, `react-dom`, `motion`, `@fontsource/mali`. Dev dependencies allowed: Vite template defaults, `vitest`, `vite-plugin-pwa`. Nothing else without asking.
- Identifiers and code comments in English; all UI copy in Thai.
- Vite `base`: `/who-gifts-who/`.
- `localStorage` key: `who-gifts-who:state:v1`.
- Colors: kraft `#C89B6D` (background), box red `#C8102E`, lid red `#A50D25`, ribbon green `#1F5C3B`, paper white `#FFFAF2`, ink `#2B1D12`.
- Font: Mali weights 500 and 700 only, self-hosted via `@fontsource/mali`.
- No client-side router; the phase lives in state only.
- Respect `prefers-reduced-motion` (no shaking, instant reveal).
- Every screen must work at 360×640, 1366×768, 1920×1080 and 3840×2160 with no horizontal scroll; size type with `clamp()` + `vmin` so portrait screens scale too. Visible keyboard focus everywhere.
- Scratch files go in `.scratchpad/` (gitignored), not `/tmp`.

## Review Focus

1. **Double press during reveal** (double-click, or Space held/repeated while shaking) → the person is marked revealed once and the animation runs once. Test: reducer `markRevealed` is idempotent (Task 3); button disabled + keydown ignored when not idle (Task 6 manual check).
2. **Names differing only by surrounding whitespace** (`"บอส "` vs `"บอส"`) → reported as duplicates, and stored trimmed. Test in Task 3 `validateParticipants`.
3. **Removing someone who is another person's partner** → that partner's `partnerId` becomes `null`, never a dangling id. Test in Task 3 reducer.
4. **`localStorage` throws or holds garbage** (private mode, quota, an older/other app's value, ids in `assignments` that no longer match participants) → app starts from empty state and keeps working in memory. Tests in Task 3 storage.
5. **Long Thai names / 30 participants on a phone-width screen** → board wraps, reveal name shrinks or wraps, nothing overflows horizontally. Manual check at 360×640 in Tasks 4–6 using names like `"สมศักดิ์ศรีสุวรรณภูมิ"`.

---

## File Structure

```
index.html                         lang="th", title "Who Gifts Who"
vite.config.ts                     base, react, pwa, vitest config
.gitignore
.github/workflows/deploy.yml
src/main.tsx                       mounts <App/> inside <AppStateProvider/>, imports fonts + global.css
src/App.tsx                        switches screen by phase
src/types.ts                       Participant, AppState, Phase
src/draw/drawAssignments.ts        draw algorithm + RandomSource
src/draw/drawAssignments.test.ts
src/state/appReducer.ts            actions, reducer, initialState
src/state/appReducer.test.ts
src/state/validateParticipants.ts  setup validation
src/state/validateParticipants.test.ts
src/state/storage.ts               loadState / saveState
src/state/storage.test.ts
src/state/AppStateContext.tsx      provider + useAppState hook
src/styles/global.css              tokens, base styles, focus ring
src/components/RestartButton.tsx
src/components/GiftBox.tsx         box + lid + shake/open animation
src/components/Confetti.tsx
src/screens/SetupScreen.tsx
src/screens/BoardScreen.tsx
src/screens/RevealScreen.tsx
src/screens/SummaryScreen.tsx
```

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles/global.css`, `src/smoke.test.ts`

**Interfaces:**
- Produces: working `npm test`, `npm run typecheck`, `npm run build`; CSS custom properties `--kraft`, `--box-red`, `--lid-red`, `--ribbon`, `--paper`, `--ink` on `:root`.

- [ ] **Step 1: Scaffold** with `npm create vite@latest` (template `react-ts`) into `.scratchpad/scaffold` (the project root is not empty, so create-vite would prompt), then move its files to the root. Delete template demo content (`src/App.css`, `src/assets/`, `public/vite.svg`, demo markup in `App.tsx`).
- [ ] **Step 2: Install** `motion @fontsource/mali` and dev `vitest`. Add scripts `test` and `typecheck` as in Global Constraints.
- [ ] **Step 3: Configure** `vite.config.ts`: `base: "/who-gifts-who/"`, `test: { environment: "node" }` (add `/// <reference types="vitest/config" />`). `index.html`: `lang="th"`, `<title>Who Gifts Who</title>`, `<meta name="theme-color" content="#C89B6D">`.
- [ ] **Step 4: `.gitignore`** must contain `node_modules`, `dist`, `.DS_Store`, `.scratchpad/`, `.superpowers/`, `.playwright-mcp/`, `*.local`.
- [ ] **Step 5: `global.css`**: color tokens above; `body` background `var(--kraft)`, color `var(--ink)`, `font-family: "Mali", sans-serif`, `margin: 0`, `min-height: 100dvh`; `*:focus-visible { outline: 4px solid var(--ribbon); outline-offset: 3px; }`; `overflow-x: hidden` on `html`. `main.tsx` imports `@fontsource/mali/500.css`, `@fontsource/mali/700.css`, `./styles/global.css`.
- [ ] **Step 6: Smoke test** `src/smoke.test.ts`: `expect(1 + 1).toBe(2)`.
- [ ] **Step 7: Verify**: `npm test` → 1 passed; `npm run typecheck` → no output, exit 0; `npm run build` → `dist/index.html` exists and references `/who-gifts-who/assets/...`.

---

### Task 2: Draw algorithm

**Files:**
- Create: `src/types.ts`, `src/draw/drawAssignments.ts`, `src/draw/drawAssignments.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/types.ts
  export type Participant = { id: string; name: string; partnerId: string | null };
  export type Phase = "setup" | "board" | "reveal" | "summary";
  export type Assignments = Record<string, string>; // giverId -> receiverId
  export type AppState = {
    version: 1;
    phase: Phase;
    participants: Participant[];
    assignments: Assignments | null;
    revealedGiverIds: string[];
    currentGiverId: string | null;
  };

  // src/draw/drawAssignments.ts
  export type RandomSource = () => number; // uniform in [0, 1)
  export const cryptoRandom: RandomSource;  // crypto.getRandomValues(Uint32Array(1))[0] / 2**32
  export type DrawFailureReason = "too-few-participants" | "no-valid-assignment";
  export type DrawResult =
    | { ok: true; assignments: Assignments }
    | { ok: false; reason: DrawFailureReason };
  export function drawAssignments(
    participants: Participant[],
    random?: RandomSource,          // default cryptoRandom
    maxSamplingAttempts?: number,   // default 2000
  ): DrawResult;
  export function isValidAssignment(participants: Participant[], assignments: Assignments): boolean;
  ```

`isValidAssignment` is true iff every participant id is a key exactly once, the values are a permutation of the ids, and for every giver `receiver !== giver` and `receiver !== giver.partnerId`. Tests and `storage.ts` (Task 3) both use it.

- [ ] **Step 1: Write failing tests** in `drawAssignments.test.ts`. Helper `people(n, couples: [number, number][])` builds participants `p0..p{n-1}` with symmetric `partnerId`.
  - `"always returns a valid assignment"`: for each n in 2..30, couples `[]`, `[[0,1]]`, and all-paired `[[0,1],[2,3],…]` (pairs up to floor(n/2)), run 200 times; skip configs that are impossible (n=2 with a couple, n=3 with a couple). Each result: `ok === true` and `isValidAssignment(...) === true`.
  - `"reports too few participants"`: `drawAssignments([])` and one participant → `{ ok: false, reason: "too-few-participants" }`.
  - `"reports impossible configurations"`: `people(2, [[0,1]])` and `people(3, [[0,1]])` → `{ ok: false, reason: "no-valid-assignment" }`.
  - `"backtracking finds a solution when sampling is disabled"`: with `maxSamplingAttempts = 0`, for n in 2..30 with all-paired couples (skip impossible), `isValidAssignment` holds; and the two impossible configs still return `no-valid-assignment`.
  - `"is roughly uniform"`: `people(4, [[0,1],[2,3]])` has exactly 4 valid assignments; over 4000 draws with `cryptoRandom`, each distinct assignment (key = JSON of sorted entries) occurs between 800 and 1200 times, and exactly 4 distinct assignments appear.
  - `"uses the injected random source"`: two runs with the same seeded PRNG (simple mulberry32 in the test file) return equal assignments.
  - `isValidAssignment` rejects: a self-assignment, a partner-assignment, a receiver used twice, a missing giver.
- [ ] **Step 2: Run** `npm test -- drawAssignments` → FAIL (module not found).
- [ ] **Step 3: Implement.** n < 2 → `too-few-participants`. Then up to `maxSamplingAttempts` times: Fisher–Yates shuffle the ids with `random` into `receivers`, map `ids[i] → receivers[i]`, return if valid (rejection sampling keeps the distribution uniform). If none valid, run randomized backtracking: process givers in a shuffled order; for each, try still-unused receivers in shuffled order that are neither self nor partner; recurse; return the first complete mapping, or `no-valid-assignment` if the search exhausts.
- [ ] **Step 4: Run** `npm test` → all pass; `npm run typecheck` → exit 0.

---

### Task 3: State: reducer, validation, storage, context

**Files:**
- Create: `src/state/appReducer.ts`, `src/state/appReducer.test.ts`, `src/state/validateParticipants.ts`, `src/state/validateParticipants.test.ts`, `src/state/storage.ts`, `src/state/storage.test.ts`, `src/state/AppStateContext.tsx`

**Interfaces:**
- Consumes: `Participant`, `AppState`, `Assignments` from `src/types.ts`; `isValidAssignment` from Task 2.
- Produces:
  ```ts
  // appReducer.ts
  export const initialState: AppState; // phase "setup", participants [], assignments null, revealedGiverIds [], currentGiverId null
  export type AppAction =
    | { type: "addParticipant"; id: string; name: string }
    | { type: "renameParticipant"; id: string; name: string }
    | { type: "removeParticipant"; id: string }
    | { type: "setPartner"; id: string; partnerId: string | null }
    | { type: "startDraw"; assignments: Assignments }   // setup -> board
    | { type: "openReveal"; giverId: string }           // board -> reveal
    | { type: "closeReveal" }                           // reveal -> board, only if current giver not yet revealed
    | { type: "markRevealed" }                          // adds currentGiverId to revealedGiverIds (idempotent)
    | { type: "finishReveal" }                          // reveal -> board, or -> summary when everyone is revealed
    | { type: "restart" };                              // any -> setup, keeps participants & couples
  export function appReducer(state: AppState, action: AppAction): AppState;

  // validateParticipants.ts
  export type SetupProblem =
    | { kind: "too-few" }
    | { kind: "empty-name"; id: string }
    | { kind: "duplicate-name"; name: string; ids: string[] };
  export function validateParticipants(participants: Participant[]): SetupProblem[];

  // storage.ts
  export const STORAGE_KEY = "who-gifts-who:state:v1";
  export function loadState(storage?: Pick<Storage, "getItem">): AppState;           // default: globalThis.localStorage
  export function saveState(state: AppState, storage?: Pick<Storage, "setItem">): void;

  // AppStateContext.tsx
  export function AppStateProvider(props: { children: React.ReactNode }): React.ReactElement;
  export function useAppState(): { state: AppState; dispatch: React.Dispatch<AppAction> };
  ```

Reducer rules not obvious from the action names:
- Phase guards: participant actions only act in `setup`; `startDraw` only in `setup`; `openReveal` only in `board` and only for a not-yet-revealed giver; other phase-mismatched actions return `state` unchanged.
- `setPartner(id, partnerId)`: clears any previous partner of both `id` and `partnerId` (setting their `partnerId` to `null`), then links the two symmetrically. `partnerId === id` is ignored. `partnerId === null` unlinks both sides.
- `removeParticipant`: also sets the removed person's partner's `partnerId` to `null`.
- `addParticipant` / `renameParticipant` store the name as given (the input field keeps what was typed); trimming happens in validation and at `startDraw` (`startDraw` stores trimmed names).
- `restart`: `phase "setup"`, `assignments null`, `revealedGiverIds []`, `currentGiverId null`.

Validation: `too-few` when fewer than 2 participants; `empty-name` per participant whose trimmed name is `""`; `duplicate-name` once per trimmed name shared by 2+ participants.

Storage: `loadState` returns `initialState` when the key is missing, `getItem` throws, JSON is invalid, `version !== 1`, the shape is wrong, or `assignments` is non-null and `!isValidAssignment(participants, assignments)`. A loaded state in `reveal` with `currentGiverId` null or unknown is normalized to `board`. `saveState` swallows exceptions.

- [ ] **Step 1: Write failing tests.**
  - `appReducer.test.ts`:
    - `"setPartner links both sides"`; `"setPartner to a new partner unlinks the old pair"` (A–B, then A–C ⇒ B.partnerId null, C.partnerId "A"); `"setPartner null unlinks both"`.
    - `"removing a partnered participant clears the partner link"` (Review Focus 3).
    - `"startDraw moves to board and trims names"`.
    - `"openReveal ignores already revealed givers"`.
    - `"markRevealed is idempotent"`: dispatch twice ⇒ `revealedGiverIds` has the giver once (Review Focus 1).
    - `"closeReveal is ignored after markRevealed"`.
    - `"finishReveal goes to summary when everyone is revealed"` and `"to board otherwise"`.
    - `"restart keeps participants and couples, clears the draw"`.
    - `"participant actions are ignored outside setup"`.
  - `validateParticipants.test.ts`: `"too-few"` for 0 and 1; `"empty-name"` for `"   "`; `"duplicate-name"` for `"บอส"` and `"บอส "` (Review Focus 2) with both ids; no problems for two distinct names.
  - `storage.test.ts` (fake storages as plain objects): round-trip equals original; missing key ⇒ `initialState`; invalid JSON ⇒ `initialState`; `getItem` throws ⇒ `initialState`; `setItem` throws ⇒ no throw; `version: 2` ⇒ `initialState`; assignments referencing an unknown id ⇒ `initialState`; `reveal` with null `currentGiverId` ⇒ phase `board` (Review Focus 4).
- [ ] **Step 2: Run** `npm test` → new tests FAIL.
- [ ] **Step 3: Implement** reducer, validation, storage as specified.
- [ ] **Step 4: Implement `AppStateContext.tsx`**: `useReducer(appReducer, undefined, () => loadState())`; `useEffect(() => saveState(state), [state])`; `useAppState` throws if used outside the provider.
- [ ] **Step 5: Run** `npm test` and `npm run typecheck` → all pass.

---

### Task 4: Setup screen, phase switch, restart

**Files:**
- Create: `src/screens/SetupScreen.tsx`, `src/components/RestartButton.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `useAppState`, `validateParticipants`, `drawAssignments`.
- Produces: `App` renders `SetupScreen | BoardScreen | RevealScreen | SummaryScreen` by `state.phase` (Board/Reveal/Summary are placeholders until Tasks 5–6); `RestartButton` (no props) used by those screens.

Behavior:
- One row per participant: name text input, partner `<select>` (`ไม่มีคู่` + every other participant who is unpaired or already this person's partner), remove button (`ลบ`). Button `เพิ่มคน` adds an empty row with `crypto.randomUUID()` and focuses its input.
- Primary button `เริ่มจับฉลาก`: run `validateParticipants`; if problems, show them and stop. Otherwise `drawAssignments`; on `ok` dispatch `startDraw`; on failure show the message and stay.
- Copy (exact):
  - heading `ใครมาบ้าง`
  - too-few: `ต้องมีอย่างน้อย 2 คน`
  - empty-name: `ใส่ชื่อให้ครบทุกช่อง`
  - duplicate-name: `มีชื่อซ้ำกัน: {name}`
  - no-valid-assignment: `จับฉลากแบบนี้ไม่ได้ เพราะคนที่มาเป็นคู่กันต้องไม่จับได้กันเอง ลองเพิ่มคนอีกอย่างน้อย 1 คน หรือแก้การจับคู่`
  - storage note (small text): `ข้อมูลเก็บไว้ในเบราว์เซอร์นี้ ใช้เครื่องและเบราว์เซอร์เดิมตั้งแต่กรอกชื่อจนจบงาน`
- `RestartButton`: low-emphasis text button `เริ่มใหม่`; `window.confirm("ล้างผลจับฉลากทั้งหมดแล้วกลับไปหน้าตั้งค่า? รายชื่อและคู่ยังอยู่")` then dispatch `restart`.
- Layout: single column, max width ~40rem, works one-handed on a phone.

- [ ] **Step 1: Implement** the screen, `RestartButton`, and the phase switch in `App.tsx`.
- [ ] **Step 2: Verify** `npm run typecheck`, `npm test`.
- [ ] **Step 3: Manual check** with `npm run dev` and Playwright at 360×640 and 1920×1080: add 5 people with one couple, pair/unpair, confirm a paired person disappears from other selects, confirm duplicate and impossible-case messages (2 people as a couple), reload and confirm the rows persist. No horizontal scroll at 360×640 with a long name (Review Focus 5). Screenshots go in `.scratchpad/`.

---

### Task 5: Board and Summary screens

**Files:**
- Create: `src/screens/BoardScreen.tsx`, `src/screens/SummaryScreen.tsx`
- Modify: `src/App.tsx` (replace placeholders)

**Interfaces:**
- Consumes: `useAppState`, `RestartButton`.

Behavior:
- Board heading `ใครยังไม่ได้จับ แตะชื่อตัวเองเลย`; large wrapping grid of buttons for unrevealed participants (dispatch `openReveal`). Below, a quieter list headed `จับแล้ว` with revealed names (not buttons). `RestartButton` in a corner.
- Summary heading `สรุปว่าใครซื้อของขวัญให้ใคร`; one line per giver in participant order: `{giver} → {receiver}`. `RestartButton`.
- Button text size scales with `clamp()`/`vmin`; 30 names must fit at 1920×1080 without scrolling and wrap cleanly at 360×640.

- [ ] **Step 1: Implement** both screens.
- [ ] **Step 2: Verify** `npm run typecheck`, `npm test`.
- [ ] **Step 3: Manual check** with Playwright at all four resolutions: 30 participants (including the long name) on the board; summary after all reveals (use a temporary reveal placeholder that dispatches `markRevealed` + `finishReveal` until Task 6 lands).

---

### Task 6: Reveal screen with gift-box animation

**Files:**
- Create: `src/screens/RevealScreen.tsx`, `src/components/GiftBox.tsx`, `src/components/Confetti.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAppState`.
- Produces:
  ```ts
  // GiftBox.tsx
  export type GiftBoxStage = "idle" | "shaking" | "opened";
  export function GiftBox(props: { stage: GiftBoxStage; reducedMotion: boolean }): React.ReactElement;
  // Confetti.tsx
  export function Confetti(props: { active: boolean }): React.ReactElement | null;
  ```

Behavior (match mockup C's look and timing):
- Initial `stage`: `"opened"` if `currentGiverId` is already in `revealedGiverIds` (refresh case; no replay), else `"idle"`.
- Idle: `ตาของ {giver}`, the closed box, primary button `กดลุ้น`, secondary button `ย้อนกลับ` (dispatch `closeReveal`).
- Press: dispatch `markRevealed` first, then `stage = "shaking"` for 2400 ms with shake intensity increasing (mockup: period 0.22 s, then 0.1 s after 1200 ms), then `"opened"`: lid flies off to the upper-left, receiver name rises large in paper white with green text-shadow, confetti burst in the four palette colors, and the line `{giver} ได้ซื้อของขวัญให้ {receiver}`. With `useReducedMotion()` true: go straight to `"opened"`, no shake, no confetti.
- Opened: button `คนต่อไป`, or `ดูสรุปทั้งหมด` when everyone is revealed; both dispatch `finishReveal`.
- Keyboard: a `window` keydown listener handles Space/Enter (press when idle, finish when opened) only when `event.target` is not a button/input/select (focused buttons already handle these keys) and ignores `event.repeat`. While shaking, all input is ignored and the button is disabled (Review Focus 1).
- `RestartButton` in a corner, hidden while shaking.
- Clear the timer on unmount.
- Receiver name: `font-size: clamp(2.5rem, 14vmin, 12rem)`, `overflow-wrap: anywhere`, centered, never wider than the viewport (Review Focus 5).

- [ ] **Step 1: Implement** `GiftBox`, `Confetti`, `RevealScreen`; wire into `App.tsx` and remove Task 5's temporary placeholder.
- [ ] **Step 2: Verify** `npm run typecheck`, `npm test`.
- [ ] **Step 3: Manual check** with Playwright: full flow for 5 people; double-click `กดลุ้น` and hold Space during shaking ⇒ one reveal; reload mid-shake ⇒ opened box with name, no replay; `ย้อนกลับ` before pressing returns to board with the person still unrevealed; emulate `prefers-reduced-motion: reduce` ⇒ instant reveal; screenshots of the opened state at all four resolutions with the long name.

---

### Task 7: Offline support and GitHub Pages deploy

**Files:**
- Modify: `vite.config.ts`, `package.json`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the built app from Tasks 1–6.

- [ ] **Step 1: Install** dev `vite-plugin-pwa`. In `vite.config.ts` add `VitePWA({ registerType: "autoUpdate", injectRegister: "script", manifest: false, workbox: { globPatterns: ["**/*.{js,css,html,woff,woff2}"] } })`. Do not import `virtual:pwa-register` anywhere: the injected plain registration script registers the worker without reloading the page, so an update deployed before the party takes effect on the next open, never mid-event.
- [ ] **Step 2: Verify the build**: `npm run build`; `dist/sw.js` exists; `dist/registerSW.js` only calls `navigator.serviceWorker.register` with scope `/who-gifts-who/`; the precache manifest in `sw.js` lists the Mali `.woff2` files for Thai.
- [ ] **Step 3: Verify offline** with `npm run preview` + Playwright at `http://localhost:4173/who-gifts-who/`: load once, add participants, set the context offline, reload ⇒ app renders with participants intact and Mali font applied.
- [ ] **Step 4: Write `.github/workflows/deploy.yml`**: triggers `push` to `main` and `workflow_dispatch`; permissions `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages`; job `build`: `actions/checkout@v4`, `actions/setup-node@v4` (node 22, `cache: npm`), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v3` with `path: dist`; job `deploy` (needs build, environment `github-pages`): `actions/deploy-pages@v4`. Check each action's latest major at implementation time and use it.
- [ ] **Step 5: Final verification**: `npm test`, `npm run typecheck`, `npm run build` all pass. Report to the user that GitHub Pages must be set to "Source: GitHub Actions" in the repo settings, that the repo must be named `who-gifts-who` (or `base` changed to match), and ask whether they want `git init` + a first commit.
