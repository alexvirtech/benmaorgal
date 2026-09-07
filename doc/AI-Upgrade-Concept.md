# BenMaorGal — AI Game-Development Upgrade
## Concept of the Optimal Solution

**Version:** 1.0 — draft for review
**Date:** 2026-09-07
**Scope:** Turn the existing MVP (deterministic pattern interpreter + 12 fixed templates) into an app where an AI can *modify existing mini-games* and *invent genuinely new ones*, driven by **Hebrew voice** from an 8-year-old.

---

## 0. Executive summary

| | Today | After the upgrade |
|---|---|---|
| Brain | ~16 English regex patterns | Claude (server-side) + fast local path |
| New games | Pick 1 of 12 hard-coded templates | AI composes a **new game recipe** from safe building blocks |
| Changes | ~10 fixed properties | Any rule, actor, motion, goal or look in the vocabulary |
| Language | English UI, Hebrew voice bolted on twice | **Hebrew-first UI + voice**, English prompt shown for transparency |
| Safety | Schema validation | Schema + closed enums + **playability simulation** before the child sees it |
| Code execution | none | still **none** — AI emits data, never JavaScript |

**The one architectural idea that makes this work:**

> Stop treating a game as *"a hard-coded template + a few parameters"*.
> Start treating it as **a declarative recipe (GameSpec v2) executed by one generic runtime**.
>
> The AI then "develops games" by writing **data**, not code — which is fast, cheap, safe, undoable, diffable and testable.

Everything else in this document follows from that.

---

## 1. What exists today (audit findings)

**Stack:** Next.js 15 App Router, React 19, plain JavaScript, **zero runtime dependencies**, deployed to Vercel (`prj_UZpTdwCjBLzhlrNeYpTZNtGdySAe`), localStorage persistence.

**Pipeline that already works well and must be preserved:**

```
prompt → interpretPrompt() → GameDefinition (JSON) → validateGameDefinition() → template.setup/update/render → GameEngine (canvas)
```

**Strengths to build on**
- `GameDefinition` is already a clean, serializable, validated JSON contract.
- `GameAction` + `applyGameAction()` + history/undo is exactly the right shape for an AI to target.
- `GameEngine` is solid: entities, dt-based loop, particles, floating text, screen shake, decorations.
- Hebrew voice (`he-IL` Web Speech) + `/api/translate` already exist — the plumbing is half-built.
- 12 templates, not 10 (flappy + whack were added).

**Blockers for AI-driven development**
1. **Game logic lives in JavaScript** (`setup/update/render` per template). An AI cannot create a new game without writing code — which §47 of the spec rightly forbids.
2. **The interpreter is English regex.** Hebrew → MyMemory literal translation → regex is a triple point of failure. "תעשה שהחתול יקפוץ" will almost never match.
3. **The action vocabulary is tiny** — 7 action types, ~16 patterns. Anything outside them silently becomes a background decoration (the catch-all `add (\w+)` rule).
4. **Voice logic is duplicated** in `src/app/page.js` and `components/robot/RobotChat.js` — two copies of the same hook and translate function.
5. **Robot messages are English string literals** scattered through the interpreter and templates.

**Concrete bugs found while reading (fix during Phase 0):**

| # | File | Issue |
|---|---|---|
| B1 | `games/[gameId]/page.js`, `GameViewport.js` | `template.update = wrapper` mutates the **shared singleton** template object. Every `setupEngine()` wraps again — after N edits the update chain runs N times per frame. Visible slowdown exactly when the child is iterating. |
| B2 | `game-sdk/input.js` | `detach()` removes the key listeners but **not** the anonymous `pointerdown/move/up` listeners on the canvas — leak on every re-setup. |
| B3 | `game-data/validation.js` | `validateObject()` computes a whitelisted `role`, then `...obj` **spreads the raw role back over it** — the whitelist is bypassed. |
| B4 | `game-sdk/engine.js` | `restart()` sets `_listeners = {}`, silently killing every `engine.on()` subscription registered by the page. |
| B5 | `game-data/schema.js` | `getSprite()` falls back to the raw type string, so an unknown type is drawn on canvas as literal text ("banana"). |
| B6 | `api/translate/route.js` | MyMemory called anonymously (tight quota, no glossary, literal translations). |

None are fatal today; all become painful once the AI multiplies the number of edits per session.

---

## 2. Target architecture

```
                        ┌──────────────────────── CLIENT (child) ────────────────────────┐
   🎤 Hebrew voice ──▶  │  VoicePrompt (one shared component)                             │
                        │    he-IL Web Speech  →  Hebrew transcript bubble                │
                        │            │                                                    │
                        │            ▼                                                    │
                        │    /api/translate  →  English text fills the prompt box  (LTR)  │
                        │            │                                                    │
                        │        [ שלח ➤ ]                                                │
                        └────────────┼───────────────────────────────────────────────────┘
                                     ▼
                        ┌──────────── BrainRouter ────────────┐
                        │  1. Hebrew phrasebook  (0 ms, free) │
                        │  2. Local regex interpreter (0 ms)  │
                        │  3. Claude  /api/robot   (1–3 s)    │
                        └────────────┬────────────────────────┘
                                     ▼
                        ┌──────── VALIDATION GATE ────────────┐
                        │  JSON schema · closed enums ·       │
                        │  numeric clamps · playability lint  │
                        │  · headless auto-QA simulation      │
                        └────────────┬────────────────────────┘
                                     ▼
                     GameSpec v2  (data — never code)
                                     ▼
                     ┌──── RecipeRuntime ────┐   ┌── native templates ──┐
                     │ generic, spec-driven  │   │ memory · snake       │
                     └───────────┬───────────┘   └──────────┬──────────┘
                                 └──────────┬───────────────┘
                                            ▼
                                    GameEngine (canvas)
                                            ▼
                        Hebrew robot reply (text + he-IL speech) + chips + Undo
```

**Two non-negotiable invariants**

1. **The AI never returns executable code.** It returns a `GameSpec` or a list of `GameAction`s. `eval` / `new Function` never appear.
2. **Nothing reaches the child unvalidated.** Schema → enums → clamps → simulation. A rejected output triggers one automatic repair attempt, then a friendly Hebrew fallback.

---

## 3. GameSpec v2 — the declarative game recipe

This is the heart of the proposal. Today a game is *"template id + a handful of numbers"*. GameSpec v2 makes a game **a description of actors, motions, rules and goals** — expressive enough to describe games that don't exist yet, restricted enough to validate exhaustively.

```jsonc
{
  "specVersion": 2,
  "id": "game_xyz",
  "runtime": "recipe",                  // "recipe" | "native:memory" | "native:snake"
  "title": { "he": "החתול והכוכבים", "en": "Star Cat" },

  "world": {
    "background": "space",              // enum
    "groundColor": "#4a8a2a",
    "gravity": 0,                       // 0–2
    "scroll": "none"                    // none | down | left | up
  },

  "actors": [
    {
      "id": "player",
      "kind": "player",
      "look": { "emoji": "🐱", "size": 90 },
      "start": { "x": "center", "y": "bottom" },
      "control": "horizontal",          // enum, see §3.2
      "speed": 6,
      "lives": 5
    }
  ],

  "spawners": [
    {
      "id": "stars",
      "everyMs": 900,
      "from": "top",                    // top | bottom | left | right | random | grid
      "max": 12,
      "actor": {
        "kind": "collectible",
        "look": { "emoji": "⭐", "size": 65 },
        "motion": "fall",               // enum, see §3.2
        "speed": 3
      }
    }
  ],

  "rules": [
    { "when": { "collide": ["player", "collectible"] },
      "then": [ { "score": 1 }, { "remove": "other" }, { "burst": "gold" } ] },

    { "when": { "leaves": { "who": "collectible", "edge": "bottom" } },
      "then": [ { "loseLife": 1 } ] },

    { "when": { "collide": ["player", "hazard"] },
      "then": [ { "loseLife": 1 }, { "remove": "other" }, { "shake": 8 } ] }
  ],

  "goals": {
    "win":  { "scoreAtLeast": 50 },
    "lose": { "livesAtMost": 0 }
  },

  "hud": ["score", "lives"],
  "sound": { "enabled": true }
}
```

### 3.1 Why this specific shape

- **An LLM writes it reliably.** It is flat, named, and every field is either an enum or a bounded number — the two things models get right.
- **It is 100 % validatable.** Unknown enum value → dropped. Number out of range → clamped. No free-form strings that reach the runtime.
- **It diffs beautifully.** "Add bombs" is `+1 spawner, +1 rule`. Undo is trivial. History becomes human-readable in Hebrew automatically.
- **It is teachable.** The future "🧠 איך המשחק שלי עובד?" screen (spec §51) is a *direct rendering of the spec* — `🐱 + ⭐ = +1 נקודה` is literally rule #1. No extra work.

### 3.2 The closed vocabularies (single source of truth: `src/game-data/spec/catalog.js`)

| Vocabulary | Values |
|---|---|
| `control` | `horizontal`, `full`, `jumpGravity`, `flap`, `paddleFollow`, `clickTarget`, `gridSteps`, `aimAndFire`, `none` |
| `motion` | `fall`, `rise`, `driftLeft`, `driftRight`, `chase`, `flee`, `bounce`, `orbit`, `zigzag`, `patrol`, `static`, `scrollWithWorld` |
| `kind` | `player`, `collectible`, `hazard`, `enemy`, `obstacle`, `projectile`, `ball`, `block`, `goal`, `decoration` |
| `when` | `collide`, `leaves`, `timer`, `click`, `keyPress`, `scoreReaches`, `timeElapsed`, `allGone` |
| `then` | `score`, `loseLife`, `gainLife`, `remove(self/other)`, `bounce`, `grow`, `shrink`, `speedUp`, `slowDown`, `spawn`, `teleport`, `stun`, `win`, `lose`, `burst`, `shake`, `floatText`, `sound` |
| `look.emoji` | any emoji from the curated catalog (~150, extends the current `SPRITES`) |
| `background` | current 8 + `cave`, `snow`, `candy`, `lava`, `underwater`, `rainbow` |

This table **is** the AI's action space. It goes into the cached system prompt verbatim. Adding a capability later = adding one enum value + ~15 lines in the runtime, and the AI can use it immediately with no prompt-engineering.

### 3.3 Coverage — an honest assessment

| Existing template | Expressible as a recipe? |
|---|---|
| catch, dodge, clicker, whack, flappy, jumper, racer, shooter | ✅ directly |
| pong, breakout | ✅ with `bounce` motion + `block` kind |
| snake | ⚠️ grid/tail state — keep as `native:snake` |
| memory | ⚠️ card-pair state machine — keep as `native:memory` |

**Recommended hybrid:** the RecipeRuntime covers the arcade family (10/12) and *all new AI-invented games*; two state-heavy games stay hand-written and are still fully parameterisable by the AI. `runtime` field selects which. This is deliberate — forcing memory-match into a rule engine would double the runtime's complexity for one game.

**New games the AI can invent on day one with this vocabulary** (no code changes): frog crossing a road, collect-while-dodging, chase-the-runaway-treasure, defend-the-base, gravity-flip runner, bouncing-ball juggling, maze-less "reach the goal", falling-platform survival, two-hazard escalating survival, target-shooting gallery, magnet collector, "don't touch the color" reflex game…

---

## 4. RecipeRuntime — one generic template

`src/game-sdk/RecipeRuntime.js` implements the **same interface the existing templates already use** (`setup / update / render`), so nothing downstream changes:

```js
export const recipeRuntime = {
  id: 'recipe',
  setup(engine, spec)  { /* build actors, register spawner timers, compile rules */ },
  update(engine, dt)   { /* controls → motions → spawners → rule evaluation → goals */ },
  render(engine, ctx)  { /* existing drawBackground + drawEntity, unchanged */ },
}
```

Internals: rules are **compiled once** at setup into small closures grouped by trigger type, so per-frame cost is a few array walks — no interpretation overhead in the hot loop. Rendering reuses `renderer.js` untouched.

Estimated size: **~600–800 lines**, replacing ~2 500 lines of duplicated template logic over time. The 10 arcade templates become 10 JSON files.

---

## 5. The AI layer

### 5.1 BrainRouter — three tiers, cheapest first

`src/ai/BrainRouter.js` tries in order and stops at the first success:

| Tier | What | Latency | Cost | Covers |
|---|---|---|---|---|
| **1. Hebrew phrasebook** | ~50 canonical Hebrew commands → `GameAction` directly, no translation, no network | **0 ms** | **0** | "יותר מהר", "תוסיף פצצות", "תן לי 5 חיים", "תעשה שיהיה יותר קשה", "רקע חלל"… |
| **2. Local interpreter** | existing regex on the English text | 0 ms | 0 | everything it handles today |
| **3. Claude** | `/api/robot` | 1–3 s | ~cents/hour | everything else, including new games |

Tier 1 is the most under-rated part of this design: **it makes the 20 commands the child actually repeats all day instant and free**, and it never breaks when the network is down. The AI is the safety net, not the hot path.

### 5.2 Three Claude jobs

| Job | Model class | Input | Output |
|---|---|---|---|
| **Translate & normalise** | fast/small (Haiku-class) | Hebrew transcript + command glossary | English text, *snapped to app vocabulary where possible* |
| **Modify game** | mid (Sonnet-class) | English prompt + current spec summary + catalogs | `{ actions[], message{he,en}, suggestions[] }` |
| **Create game** | mid (Sonnet-class) | English prompt + catalogs | `{ spec, message{he,en}, suggestions[] }` |

Pin the exact model IDs at implementation time; the code should read them from env (`ROBOT_MODEL`, `TRANSLATE_MODEL`) so they can be swapped without a deploy.

### 5.3 Implementation notes

- **No SDK dependency.** A ~120-line `src/ai/claude.js` using `fetch` against the Messages API keeps the project's zero-dependency policy (spec §64). Handles: timeout, 1 retry on 429/5xx, JSON extraction, token accounting.
- **Prompt caching.** The system prompt (spec schema + full catalogs + few-shot examples ≈ 5–7 k tokens) is constant → mark it cacheable. This is the single biggest cost and latency lever; without it every request re-pays for the catalogs.
- **Structured output.** Force JSON via a tool/schema definition rather than "please reply in JSON" — dramatically fewer parse failures.
- **Repair loop.** If validation fails, send the validator's error list back once with `"fix this"`. Two strikes → friendly Hebrew fallback with chips. Never show the child a stack trace.
- **`AIGameInterpreter` exposes the exact same signature as `LocalGameInterpreter`** (`interpretPrompt(prompt, currentGame)`), so `page.js` and `[gameId]/page.js` change by one import — precisely the seam the original spec (§48) reserved.

### 5.4 System-prompt shape (sketch)

```
You are the game robot for an 8-year-old child.
You NEVER write code. You return only JSON matching the GameSpec/GameAction schema below.
<catalog>…closed enums, verbatim…</catalog>
<current_game>…compact spec summary…</current_game>
Rules:
- Prefer the smallest change that satisfies the request.
- Keep the game winnable and fair for a young child.
- Always reply in BOTH Hebrew (primary, warm, short, 1–2 sentences, emoji ok) and English.
- Always propose 3 next things to try, in Hebrew.
- If the request is unclear or off-topic, ask ONE short Hebrew question instead of guessing.
```

---

## 6. Safety, validation and auto-QA

Five gates, in order:

1. **Schema** — unknown keys dropped, required keys defaulted.
2. **Closed enums** — any value outside the catalog is discarded (not "corrected").
3. **Clamps** — speeds 0.5–15, sizes 20–140, lives 1–20, spawn 200–10 000 ms, ≤ 8 spawners, ≤ 30 rules, ≤ 60 on-screen actors.
4. **Playability lint** — static checks: does the player have a control? is there at least one way to score? is the win condition reachable given spawn rate × points? is there a lose condition?
5. **Auto-QA simulation** *(the differentiator)* — `src/game-sdk/simulate.js` runs the spec **headlessly in a Web Worker**: no canvas, fixed `dt`, a scripted bot that chases the nearest collectible and avoids the nearest hazard. 60 seconds of game time runs in ~50–150 ms of real time.

   Asserts: bot can score within 30 s · bot doesn't die within 5 s while playing correctly · at least one spawner fires · no `NaN` / runaway entity count.
   Fails → one repair attempt → else fall back to the nearest existing template and say so kindly in Hebrew.

**Child-safety layer**
- API key server-side only; the browser never sees it.
- System prompt scopes the model to game-making; off-topic → one gentle Hebrew redirect.
- Rate limit + **daily budget cap** with a friendly message ("הרובוט צריך לנוח 😴 ננסה מחר"), so a stuck loop can never produce a surprise bill.
- No user-to-user content, no external links, no image uploads.
- Optional hidden `/parent` page listing every prompt + result from localStorage.

---

## 7. Hebrew-first experience

**Decision taken:** Hebrew UI (RTL), Hebrew robot replies spoken aloud, **English visible in the prompt box** — which doubles as gentle English exposure for an 8-year-old.

### 7.1 Flow A — improve an existing game (`/games/[id]`)

```
1.  Child taps the big  🎤 מה לשנות?  button
2.  he-IL speech recognition starts; live waveform; auto-stops on silence
3.  Hebrew transcript appears in an RTL bubble:  "תוסיף פצצות שנופלות מהר"
4.  /api/translate  →  prompt box (dir="ltr") fills with:  "add fast falling bombs"
        ↳ tier-1 phrasebook hit? filled instantly, no network
5.  Child may edit, then taps  [ שלח ➤ ]
6.  BrainRouter → GameAction[]  →  validation gate
7.  Engine hot-reloads the running game (score/lives preserved where sensible)
8.  Robot bubble in Hebrew + spoken aloud (he-IL SpeechSynthesis):
        "הוספתי פצצות! 💣 תיזהר מהן!"
9.  3 Hebrew suggestion chips refresh · autosave 💾 · ↩ בטל always visible
```

### 7.2 Flow B — a brand-new game (home page)

Identical steps 1–5. Step 6 asks Claude for a **full GameSpec**; step 6.5 runs the auto-QA simulation; then the game is created, saved and the child lands in the workspace already playing it. Target: **under 5 seconds** from "שלח" to a playable game, with the robot animating and the message streaming in.

### 7.3 UX rules for an 8-year-old

- **One primary button per screen.** The mic is the biggest thing on the page.
- **Show both languages.** Hebrew (what he said) above, English (what the robot heard) in the box. Never hide the translation — if it's wrong he can see why.
- **Speak every robot reply.** An 8-year-old listens faster than he reads.
- **Never a dead end.** Any failure → Hebrew apology + 3 tappable chips that definitely work.
- **Undo is permanent furniture**, not a menu item.
- **No spinner longer than ~2 s** without the robot animating and saying "רגע, אני בונה… 🤖✨".
- Touch targets ≥ 48 px; game canvas stays LTR inside the RTL shell.

### 7.4 Speech-recognition reality check

`webkitSpeechRecognition` with `lang='he-IL'` works well in Chrome/Edge desktop and Android Chrome. iOS Safari support exists but is inconsistent, and Firefox has none.

**Fallback ladder:** Web Speech → (if unsupported) `MediaRecorder` → `/api/stt` → (if no STT provider configured) Hebrew typing with the phrasebook chips. Note: Claude has no speech-to-text; a server STT fallback needs a separate provider (Whisper / Google / Deepgram) — treat it as **optional Phase 3**, not a blocker. Decide the target device first: if the grandson uses one Android tablet or a laptop with Chrome, the fallback may never be needed.

### 7.5 Translation strategy

Replace the literal MyMemory call with a **normalising** translator:

```
Hebrew: "תעשה שהחתול ילך יותר מהר"
MyMemory (today): "Make the cat go more quickly"   → matches no regex ❌
Normalising (new): "make the player faster"        → tier-1/tier-2 hit ✅
```

The translate prompt carries the app's command glossary and is told: *"prefer the app's canonical phrasing; if it doesn't fit, translate plainly."* Layers:

1. localStorage cache of already-translated Hebrew strings (kids repeat themselves constantly)
2. built-in phrasebook (~50 entries, 0 ms)
3. Claude Haiku with glossary
4. MyMemory (kept as last-resort fallback so the app still works with no API key)

---

## 8. Cost, latency, deployment

| Item | Plan |
|---|---|
| Key | `ANTHROPIC_API_KEY` in Vercel env (Production + Preview), **never** `NEXT_PUBLIC_*` |
| Routes | `nodejs` runtime, `export const maxDuration = 30` |
| Streaming | SSE for the robot message so text appears while the spec is still being validated |
| Caching | prompt caching on the system block; localStorage cache for translations |
| Budget | per-day request cap + token accounting logged per call; friendly Hebrew stop message |
| Fallback | with no API key configured the app **still runs** on tiers 1–2 — nothing regresses |
| Realistic latency | phrasebook 0 ms · translate 0.3–0.8 s · modify 1–2 s · create + simulate 2–4 s |
| Realistic cost | single-child usage with caching lands in the *cents per play session* range; the daily cap is the guarantee, not the estimate |

---

## 9. Data model & persistence

- New storage key `benmaorgal-games-v2`; on first read, migrate every v1 game through `migrate.v1tov2.js` (deterministic mapping template → recipe) and keep the v1 blob under `legacyDefinition` for one release.
- Game record gains: `specVersion`, `spec`, `runtime`, `title:{he,en}`, `messages[].lang`, `history[].promptHe`.
- Repository interface (`getGames/getGame/saveGame/deleteGame`) is unchanged — cloud sync later swaps the implementation only, exactly as spec §33 intended.
- Corrupt entries are skipped, not fatal (spec §60 already requires this).

---

## 10. Module plan

```
src/ai/
  claude.js                  # fetch wrapper: caching, retry, timeout, JSON extraction
  BrainRouter.js             # phrasebook → local → Claude
  AIGameInterpreter.js       # same interface as LocalGameInterpreter
  prompts/system.games.js    # schema + catalogs + few-shots (cacheable)
  prompts/system.translate.js
  phrasebook.he.js           # ~50 Hebrew commands → GameAction

src/app/api/
  robot/route.js             # POST { mode: create|modify, prompt, spec }
  translate/route.js         # upgraded, glossary-aware, MyMemory fallback
  stt/route.js               # optional, Phase 3

src/game-data/spec/
  schema.v2.js  validate.v2.js  migrate.v1tov2.js  catalog.js

src/game-sdk/
  RecipeRuntime.js           # generic spec-driven template
  simulate.js                # headless auto-QA (Web Worker)

src/game-recipes/            # the 10 arcade templates, now as JSON
  catch.json dodge.json jumper.json shooter.json pong.json
  breakout.json clicker.json racer.json flappy.json whack.json

src/i18n/  he.js  en.js  useLang.js
src/components/voice/VoicePrompt.js   # THE single mic + translate + send component
src/components/robot/RobotBubble.js   # RTL bubble + he-IL text-to-speech
```

---

## 11. Phased roadmap

| Phase | Deliverable | Why this order | Rough size |
|---|---|---|---|
| **0 — Foundations** | Fix B1–B6 · extract `VoicePrompt` · i18n layer + RTL Hebrew UI · upgrade `/api/translate` · Hebrew phrasebook (tier 1) | Everything else sits on this; **already gives the target UX with zero AI cost** | 1–2 days |
| **1 — AI modifies games** | `claude.js` · `/api/robot` (modify) · `AIGameInterpreter` · BrainRouter · repair loop · Hebrew replies + TTS | Highest value / lowest risk. Existing 12 games instantly become far more malleable. Ship and let him play with it. | 2–3 days |
| **2 — AI creates games** | GameSpec v2 · validator · `RecipeRuntime` · 10 templates ported to recipes · `/api/robot` (create) · migration | The real "new games" capability. Do it *after* Phase 1 proves the prompt/validation loop. | 4–6 days |
| **3 — Trust & polish** | Auto-QA simulation · educational "איך זה עובד?" screen · daily budget cap · parent page · STT fallback | Makes AI output dependable enough to hand over unsupervised | 2–3 days |
| **4 — Later** | Accounts, cloud games, sharing with friends, remixing others' recipes | Spec §78 territory; the repository seam is already there | — |

**Ship after Phase 1.** He gets a dramatically better robot in ~a week, and Phase 2 is built against a validated feedback loop instead of guesses.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hebrew speech recognition weak on his device | Test on the actual device in Phase 0; phrasebook chips + typing always work |
| Translation mangles the intent | Show the English back; normalising glossary; child can edit before sending; two-way display |
| AI invents an unplayable game | Playability lint + headless simulation + repair loop + template fallback |
| Latency kills the magic | Tiers 1–2 handle the frequent commands at 0 ms; streaming + robot animation for the rest |
| Runaway API cost | Server-only key, daily cap, prompt caching, translation cache |
| Recipe runtime can't express something he wants | Hybrid: native templates stay; adding an enum value + runtime case is a ~15-line change |
| Scope creep | Phase 0/1 are independently shippable and useful even if Phase 2 slips |
| Regression in `/battle` | Out of scope entirely — untouched static app under `/battle` |

---

## 13. Acceptance tests (Hebrew, on the real device)

**Existing game — Flow A**

1. Open a Catch game → 🎤 → say **"תעשה שהחתול ילך יותר מהר"** → box shows *"make the player faster"* → שלח → cat visibly faster, Hebrew reply spoken, ↩ בטל restores.
2. 🎤 **"תוסיף פצצות"** → bombs fall and cost a life.
3. 🎤 **"תן לי עשרה חיים"** → HUD shows 10.
4. 🎤 **"תעשה שהרקע יהיה חלל"** → space background.
5. 🎤 something the app has never seen — **"תעשה שהכוכבים יזוזו בזיגזג"** → AI tier produces a valid change (motion `zigzag`) *or* asks one short Hebrew clarifying question. **Never** a silent decoration or an English error.

**New game — Flow B**

6. Home → 🎤 **"תעשה משחק שבו כלב בורח מדבורים ואוסף עצמות"** → new playable game in < 5 s, dog + bees + bones, winnable, saved to המשחקים שלי.
7. Reload the browser → game, title, history and chat survive.
8. Airplane mode → tiers 1–2 still work; robot says so in Hebrew rather than failing.

---

## 14. Open questions for you

1. **Target device** — which browser/OS will he actually use? This decides how much the STT fallback matters.
2. **Voice output** — should the robot always speak Hebrew aloud, or only on request (a 🔊 toggle)?
3. **Do you want the English kept visible** as a learning aid (my assumption), or hidden once translation is trusted?
4. **Budget ceiling** you want enforced per day.
5. **Should the 12 existing templates be replaced by recipes**, or kept as hand-tuned versions alongside them? (I recommend porting the 10 arcade ones and keeping snake/memory native.)

---

*Prepared from a full read of `doc/Claude Code Prompt — BenMaorgal Game-Making Robot MVP.md`, `README.md`, and the complete `src/` tree at commit `17bb383`.*
