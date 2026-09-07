# DEVELOPMENT TASK

## BenMaorGal — AI Upgrade, Phase 0 + Phase 1

Upgrade the existing **BenMaorGal Game-Making Robot** so that a Hebrew-speaking 8-year-old can improve his games by **talking**, and so that a real AI (Claude) understands anything he says — not just 16 hard-coded English regexes.

Target site: **https://www.benmaorgal.com**
Repository root: this project (Next.js 15 App Router, React 19, plain JavaScript, Vercel).

This document covers **Phase 0 (foundations)** and **Phase 1 (AI-driven game modification)** only.
The declarative GameSpec v2 / RecipeRuntime work is **Phase 2 and is explicitly out of scope here** — see §3.

Read `doc/AI-Upgrade-Concept.md` first for the full architectural context.

---

# 0. VERY IMPORTANT: INSPECT BEFORE CHANGING

1. Read the whole repository before editing anything.
2. Run `npm install && npm run dev` and confirm the app works today.
3. Confirm `/battle` and `/battle/lobby.html` still load.
4. Create a short internal implementation plan, then execute it phase by phase.
5. **Do not delete or rewrite the existing application.** This is an upgrade, not a rewrite.
6. Commit in logical steps so any single change can be reverted.

---

# 1. DECISIONS ALREADY TAKEN — DO NOT RE-LITIGATE

| Decision | Value |
|---|---|
| AI provider | **Anthropic Claude**, called server-side from Next.js route handlers |
| AI output | **Structured JSON only** (GameActions). The AI never writes JavaScript. `eval` / `new Function` are forbidden. |
| Interface language | **Hebrew UI, RTL**, robot replies in Hebrew and spoken aloud |
| Prompt box | Shows the **English** translation, visible and editable, exactly as today's flow implies |
| New games in this phase | AI selects among the **existing 12 templates** and configures them. Inventing brand-new game types is Phase 2. |
| Dependencies | **Zero new npm packages.** Call the Anthropic API with `fetch`. No SDK, no i18n library, no UI library. |
| Language | **Plain JavaScript.** Do not introduce TypeScript. |
| Style | ES modules, no semicolons (match existing code), small modules |
| Target browser | **Google Chrome**, desktop and Android. Other browsers must degrade gracefully but are not a test target. |
| AI on/off | **Global**, toggled at runtime by visiting a **secret URL** that writes a flag to a shared KV store (§6), enforced server-side. When off, the whole app runs in **Phase 0 mode**. No admin page, no login. |

---

# 2. THE TWO FLOWS THAT MUST WORK WHEN YOU ARE DONE

## Flow A — improve an existing game (`/games/[gameId]`)

```
1. Child taps the big microphone button:  🎤 מה לשנות?
2. Hebrew speech recognition (he-IL) starts, with a visible listening state
3. The Hebrew transcript appears in an RTL bubble:  "תוסיף פצצות שנופלות מהר"
4. The text is translated to English and FILLS THE PROMPT INPUT:  "add fast falling bombs"
5. The child may edit it, then taps  [ שלח ➤ ]
6. The change is interpreted, validated and applied to the running game
7. The robot answers in Hebrew, in an RTL bubble, and SPEAKS the answer aloud
8. Three Hebrew suggestion chips refresh; ↩ בטל (undo) is always visible; autosave
```

## Flow B — create a new game (home page `/`)

Identical steps 1–5. Step 6 creates a new game from the best-matching template, saves it, and navigates to `/games/[id]` with the game ready to play.

**Both flows must use the same component.** Today the speech-recognition hook and the translate helper are duplicated in `src/app/page.js` and `src/components/robot/RobotChat.js`. That duplication must be gone.

---

# 3. EXPLICITLY OUT OF SCOPE IN THIS TASK

Do **not** implement any of the following now:

- GameSpec v2, `RecipeRuntime`, porting templates to JSON recipes (Phase 2)
- Headless auto-QA simulation (Phase 3)
- Server-side speech-to-text / Whisper fallback (Phase 3)
- The educational "איך המשחק שלי עובד?" screen (Phase 3)
- User accounts, cloud database, sharing, multiplayer (Phase 4)
- Any change to `/battle` (the legacy Ben's Brawl Apps). Leave it alone.
- AI-generated images or sprites. Emoji only.
- An admin page or a login form. The switch is the secret URL plus the KV flag in §6 — the dashboard is Phase 3 (§6.10).

---

# 4. PHASE 0 — FOUNDATIONS

Phase 0 must be **shippable on its own** and must deliver the full Hebrew UX **with zero AI calls**.

## 4.1 Fix the existing defects first

### B1 — Template mutation leak (highest priority)

`src/app/games/[gameId]/page.js` and `src/components/games/GameViewport.js` both do:

```js
const origUpdate = template.update
template.update = (eng, dt) => { input.update(); origUpdate.call(template, eng, dt); setGameState({...eng.state}) }
```

`getTemplate(id)` returns a **shared singleton object**. Every call to `setupEngine()` wraps `update` again, so after N modifications the update chain executes N times per frame. This gets worse exactly while the child is iterating — which is the core loop of this product.

**Required fix:** never mutate the template. Move the responsibility into `GameEngine`:
- call `engine.input.update()` at the top of the engine's own loop, before `template.update(...)`
- add an `engine.onStateChange` callback (or reuse `engine.emit('state', ...)`) that the page subscribes to
- delete the wrapper code from both files

### B2 — Input listener leak

`src/game-sdk/input.js` — `attach()` registers anonymous `pointerdown` / `pointermove` / `pointerup` listeners on the canvas; `detach()` removes only the window key listeners. Store bound references and remove all of them in `detach()`.

### B3 — Validation bypass

`src/game-data/validation.js` — `validateObject()` computes a whitelisted `role`, then `...obj` spreads the raw `obj.role` back over it, defeating the whitelist. Restructure so the spread happens **first** and all validated fields are written **after** it. Do the same audit for every other field in that function.

### B4 — Listeners destroyed on restart

`src/game-sdk/engine.js` — `restart()` sets `this._listeners = {}`, silently unsubscribing everything the page registered. Keep listeners across restart; only reset entities, particles, custom state and game state.

### B5 — Unknown sprite renders as text

`src/game-data/schema.js` — `getSprite()` returns the raw type string when unknown, so an unrecognised type is drawn on the canvas as literal text. Return a safe fallback emoji (`'✨'`) and log a warning in development.

### B6 — Translation route

`src/app/api/translate/route.js` — rewritten in §4.5.

After these fixes, re-verify all 12 templates still play correctly.

## 4.2 Internationalisation layer + RTL

Create `src/i18n/`:

```
src/i18n/
  he.js         # every UI string, Hebrew
  en.js         # same keys, English
  index.js      # t(key, vars), getLang(), setLang(), useLang() hook
```

Requirements:

- Default language **Hebrew**. Persist the choice in `localStorage` under `benmaorgal-lang`.
- A small language toggle (`עב / EN`) in `Navigation.js`. Not prominent — the child should never need it.
- When Hebrew is active, set `dir="rtl"` and `lang="he"` on the document element (do this in a client component or via `layout.js`; make sure server rendering does not produce a hydration mismatch — render a stable default and apply the stored preference in an effect).
- **The game canvas and the prompt input stay LTR.** Put `dir="ltr"` explicitly on the canvas container and on the English prompt `<textarea>`.
- Font stack must include Hebrew-capable system fonts, e.g. `system-ui, 'Segoe UI', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif`. **Do not** add a webfont dependency.
- Every hard-coded English string in `src/app/**` and `src/components/**` must move into the dictionaries. Grep for quoted English text; none should remain in JSX.

Keys needed at minimum (Hebrew values are the ones that matter):

```
nav.create        "צור משחק"          nav.myGames      "המשחקים שלי"
nav.battle        "משחקי קרב"         home.title       "תבנה משחק משלך!"
home.subtitle     "תגיד לי איזה משחק אתה רוצה, ואני אבנה אותו!"
home.micHint      "לחץ על המיקרופון וספר לי"
chat.placeholder  "מה לשנות במשחק?"    chat.send        "שלח"
voice.listening   "אני מקשיב..."       voice.youSaid    "אמרת:"
voice.translating "רגע, מתרגם..."      voice.unsupported "הדפדפן הזה לא תומך בדיבור — אפשר לכתוב"
robot.thinking    "רגע, אני בונה... 🤖✨"
robot.tired       "הרובוט צריך לנוח 😴 ננסה שוב מחר"
robot.offline     "אני לא מצליח להתחבר עכשיו, אבל אפשר לנסות פקודות פשוטות"
controls.play     "שחק"  controls.restart "מהתחלה"  controls.undo "בטל"
game.win          "ניצחת!"  game.over "נגמר המשחק"
games.empty       "עוד לא בנית משחק! 🎮"
games.deleteConfirm "למחוק את \"{title}\"? המשחק ייעלם."
```

## 4.3 `VoicePrompt` — the single shared component

Create `src/components/voice/VoicePrompt.js`. **This is the most important UI component in the product.** Both the home page and the workspace use it; the duplicated hooks in `page.js` and `RobotChat.js` are deleted.

```js
<VoicePrompt
  placeholder={t('chat.placeholder')}
  busy={boolean}            // robot is working
  onSubmit={(english, hebrew) => {}}   // hebrew may be null when typed directly
/>
```

Behaviour spec:

1. **One large primary microphone button**, minimum 64×64 px, Hebrew label. It is the visually dominant control on the screen.
2. Tap to start listening; tap again to stop; auto-stop on silence. Show an unmistakable listening state (colour change + pulse + `voice.listening` text). Do not rely on colour alone.
3. On result: show the raw Hebrew transcript in a small RTL bubble labelled `voice.youSaid` **above** the input. It stays visible until the next recording.
4. Translate the Hebrew (see §4.4 and §4.5) and write the English result **into the input**, replacing its contents. Show `voice.translating` while it runs.
5. The input is `dir="ltr"`, editable, and `Enter` submits.
6. A separate small 🎤EN button for direct English input is optional and secondary.
7. If `SpeechRecognition` is unavailable, hide the mic, show `voice.unsupported`, and keep typing plus the suggestion chips fully functional. **The app must never be unusable without speech.**
8. Request microphone permission only on first tap, and handle denial with a friendly Hebrew message.
9. Guard against double-submits while `busy` is true.

## 4.4 Hebrew phrasebook — the instant, free tier

Create `src/ai/phrasebook.he.js`.

This is the highest-leverage piece of Phase 0: the commands the child repeats all day resolve in **0 ms with no network and no cost**, and they keep working offline and without an API key.

```js
// exported
export function matchHebrew(text)
// → { english: 'make the player faster', action: {...} } | null
```

Rules:

- Normalise first: trim, collapse whitespace, strip punctuation and niqqud, lower-case Latin characters.
- Match against ordered regex patterns, most specific first.
- **Always return the canonical English string too**, because it must appear in the prompt box (Flow A step 4). The phrasebook therefore doubles as an offline translator for common commands.
- Return the `GameAction` directly when it is unambiguous; return only `english` when the action depends on the current game.

Coverage required (build the patterns, do not hard-code only these exact strings):

| Hebrew (variants) | Canonical English |
|---|---|
| יותר מהר / תעשה יותר מהר / מהר יותר / שירוץ מהר | make the player faster |
| יותר לאט / לאט יותר / שילך לאט | make the player slower |
| תוסיף פצצות / פצצות / שיהיו פצצות | add bombs |
| תוריד את הפצצות / בלי פצצות / תמחק פצצות | remove bombs |
| תן לי {N} חיים / אני רוצה {N} חיים | give me {N} lives |
| עוד חיים / תוסיף לי חיים / חיים נוספים | add a life |
| יותר קשה / תעשה שיהיה קשה | make it harder |
| יותר קל / תעשה שיהיה קל | make it easier |
| יותר גדול / תעשה אותי גדול | make the player bigger |
| יותר קטן / תעשה אותי קטן | make the player smaller |
| רקע חלל / תעשה רקע של חלל | make the background space |
| רקע יער / ים / עיר / מדבר / לילה / דשא / שמיים | make the background forest / ocean / city / desert / night / grass / sky |
| תחליף אותי ל{X} / אני רוצה להיות {X} | change the player to {X} |
| ניקוד {N} / צריך {N} נקודות | set target score to {N} |

Hebrew number words `אחד…עשרים` and digits must both parse. Character vocabulary must cover at least: חתול cat, כלב dog, צפרדע frog, רובוט robot, חללית spaceship, מכונית car, גיבור hero, חייזר alien, ציפור bird, דג fish, קוף monkey, ארנב bunny.

Also add a Hebrew **creation** phrasebook for the home page, e.g. `תעשה משחק שחתול תופס כוכבים` → `make a game where a cat catches stars`.

Write unit-style checks (a plain `node` script under `scripts/` is fine — no test framework) asserting every row above resolves correctly.

## 4.5 Rewrite `/api/translate`

New contract:

```
POST /api/translate
  { "text": "תוסיף פצצות", "from": "he", "to": "en", "context": "modify" | "create" }
→ { "translated": "add bombs", "source": "phrasebook" | "cache" | "claude" | "mymemory" | "passthrough" }
```

Resolution order:

1. **Phrasebook** (§4.4) — instant.
2. **Client-side cache** — the caller checks `localStorage` (`benmaorgal-tr-v1`, capped at ~300 entries, LRU) before calling at all. Children repeat themselves constantly; this must be exploited.
3. **Claude** (Phase 1 only — see §5) using a *normalising* prompt: it is told the app's canonical command vocabulary and instructed to prefer it. `"תעשה שהחתול ילך יותר מהר"` must come back as `"make the player faster"`, not `"make the cat go more quickly"`.
4. **MyMemory** — keep as last-resort fallback so the app still works with no API key. Add a contact email query parameter to lift the anonymous quota.
5. **Passthrough** — return the original text rather than failing.

The route must never return a 500 to the client. On total failure return `{ translated: <original>, source: 'passthrough' }` with status 200 and let the interpreter deal with it.

## 4.6 Robot bubble + Hebrew speech output

Create `src/components/robot/RobotBubble.js`:

- RTL bubble, robot avatar, warm short Hebrew text.
- **Speaks the message aloud** via `window.speechSynthesis` with `lang='he-IL'`, picking a Hebrew voice when one is available.
- A persistent 🔊 / 🔇 toggle stored in `localStorage` (`benmaorgal-tts`). **Default: on.** An 8-year-old listens faster than he reads.
- Cancel any in-flight utterance before speaking a new one; cancel on unmount and on route change.
- Never speak the English text — Hebrew only.

`RobotChat.js` renders robot messages through this component and keeps user messages as plain RTL bubbles.

## 4.7 Hebrew suggestion chips

Template `suggestions` become bilingual objects:

```js
suggestions: [
  { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
  { he: 'תוסיף פצצות',        en: 'add bombs',              icon: '💣' },
  { he: 'תן לי 5 חיים',        en: 'give me 5 lives',        icon: '❤️' },
  { he: 'רקע של חלל',          en: 'make the background space', icon: '🌌' },
]
```

The chip **displays Hebrew** and **submits English**. Update all 12 templates.

## 4.8 Phase 0 definition of done

- `npm run build` passes.
- The whole UI is Hebrew and RTL; the game canvas and prompt input are LTR.
- One `VoicePrompt` component; no duplicated speech or translate code anywhere.
- Speaking any phrasebook command changes the game **instantly, with the network disabled**.
- The robot answers in Hebrew and speaks it aloud.
- All 12 templates play, save, reload and undo exactly as before.
- `/battle` is untouched and working.

---

# 5. PHASE 1 — THE AI BRAIN

Phase 1 makes the robot understand **anything the child says**, in any phrasing, and turn it into validated actions on the existing 12 templates.

## 5.1 `src/ai/claude.js` — the only place that talks to Anthropic

A single small module (~120 lines) using `fetch`. **No SDK dependency.**

```js
export async function callClaude({ system, messages, tools, model, maxTokens, temperature, signal })
// → { json, text, usage: { inputTokens, outputTokens, cacheReadTokens }, model, latencyMs }
```

Requirements:

- Reads `process.env.ANTHROPIC_API_KEY`. **Server-side only.** Never expose it; never prefix any AI env var with `NEXT_PUBLIC_`.
- **Prompt caching on the system block.** The system prompt carries the full action catalog and few-shot examples and is constant — mark it cacheable. This is the single biggest cost and latency lever.
- **Forced structured output**: define the response shape as a tool/schema and require the model to use it. Do not ask for JSON in prose and hope.
- Timeout (default 20 s) via `AbortController`; one retry on 429 / 5xx with short backoff; no retry on 4xx.
- Returns usage numbers so the budget guard (§5.7) can account for them.
- Throws typed errors (`AI_DISABLED`, `AI_TIMEOUT`, `AI_RATE_LIMIT`, `AI_BAD_OUTPUT`) that callers map to friendly Hebrew messages.

Models are read from env, never hard-coded:

```
ROBOT_MODEL      # a current Claude Sonnet model id — game reasoning
TRANSLATE_MODEL  # a current Claude Haiku model id — fast translation
```

## 5.2 System prompts

`src/ai/prompts/system.games.js` — built once at module load, cacheable, containing:

- Role: the game robot for an 8-year-old Hebrew-speaking child.
- Hard rules: never write code; return only the defined JSON; prefer the smallest change that satisfies the request; keep the game winnable and fair for a young child; never scary or violent beyond cartoon level.
- The **complete action catalog** (§5.4) with allowed enums: template ids, sprite keys, background names, roles, effects, and every numeric range.
- The compact current-game summary is injected per request as a separate (uncached) block.
- Output must always include **both Hebrew and English** message text, plus exactly three Hebrew suggestions.
- If the request is unclear, ambiguous or off-topic: return `intent: "CLARIFY"` with **one** short Hebrew question. Never guess, and never silently do something unrelated.

`src/ai/prompts/system.translate.js` — the normalising translator described in §4.5 step 3, carrying the canonical command vocabulary as a glossary.

## 5.3 `POST /api/robot`

```
Request
{
  "mode": "modify" | "create",
  "prompt": "add fast falling bombs",     // English
  "promptHe": "תוסיף פצצות שנופלות מהר",   // optional, for logging
  "game": {                                // omitted when mode === "create"
    "template": "catch",
    "definition": { ... }                  // the current GameDefinition
  },
  "deviceId": "..."                        // random uuid stored in localStorage
}

Response 200
{
  "intent": "MODIFY_GAME" | "CREATE_GAME" | "CLARIFY" | "REFUSE",
  "actions": [ /* GameAction[] — empty for CLARIFY/REFUSE */ ],
  "definition": { ... },                   // only for CREATE_GAME
  "message": { "he": "הוספתי פצצות! 💣", "en": "I added bombs! 💣" },
  "suggestions": [ { "he": "...", "en": "...", "icon": "💣" } ],
  "meta": { "source": "claude", "model": "...", "latencyMs": 1840, "repaired": false }
}
```

- Runtime `nodejs`, `export const maxDuration = 30`.
- Never returns 500 to the client. Any failure becomes `intent: "CLARIFY"` (or `"REFUSE"`) with a friendly Hebrew message and three working chips.
- `mode: "create"` in this phase: choose the best-fitting **existing template**, then set player type, collectible/hazard types, background, lives, target score and title. It must **not** invent new mechanics — that is Phase 2.

## 5.4 Extend the action vocabulary

Current `ACTION_TYPES` cannot express obvious child requests. Notably **there is no way to change an existing object** — "make the stars slower" is impossible today. Add:

| New action | Shape | Notes |
|---|---|---|
| `MODIFY_OBJECT` | `{ type:'MODIFY_OBJECT', match:{ type?, role?, id? }, changes:{ speed?, spawnRate?, points?, size?, motion?, sprite? } }` | Applies to every matching object. The most-requested missing capability. |
| `SET_TITLE` | `{ type:'SET_TITLE', title:{ he, en } }` | Titles become bilingual |

Add three engine-level, template-agnostic properties that the AI may set:

| Property | Range | Implementation |
|---|---|---|
| `objects[].size` | 30–120 | already partly honoured; make it consistent in every spawning template |
| `objects[].motion` | `fall` \| `zigzag` \| `drift` \| `spin` | implement once as `applyMotion(entity, dt)` in `game-sdk/physics.js` and call it from the templates that move falling entities (catch, dodge, racer, shooter, flappy). Do **not** duplicate the maths per template. |
| `rules.timeLimit` | 0 (off) or 10–300 s | implement centrally in `GameEngine`: countdown in the HUD, then win-if-score-reached / lose otherwise |

Update, in lockstep:
- `src/game-data/actions.js` — `ACTION_TYPES`, `applyGameAction()`, `describeAction()` (bilingual descriptions)
- `src/game-data/validation.js` — enums and clamps for every new field
- `src/ai/prompts/system.games.js` — the catalog the AI sees
- `README.md` — the "Adding a new action" section

**Rule: the AI's action space and the validator must be generated from one shared constants module.** Create `src/game-data/catalog.js` exporting the templates, sprite keys, backgrounds, roles, effects, motions and every numeric range, and have the validator, the prompt builder and the UI all import from it. A capability that exists in one place and not the other is a bug.

## 5.5 `AIGameInterpreter` and `BrainRouter`

`src/ai/AIGameInterpreter.js` exposes **exactly the signature `LocalGameInterpreter` already has**:

```js
export async function interpretPrompt(prompt, currentGame = null)
// → { intent, actions?, definition?, robotMessage, robotMessageHe, suggestions }
```

so the pages change by one import — this is the seam the original MVP spec reserved in §48.

`src/ai/BrainRouter.js` tries tiers in order and stops at the first success:

| Tier | Source | Latency | Cost |
|---|---|---|---|
| 1 | Hebrew phrasebook (§4.4) | 0 ms | 0 |
| 2 | existing `LocalGameInterpreter` regexes on the English text | 0 ms | 0 |
| 3 | `AIGameInterpreter` → `/api/robot` | 1–3 s | metered |

The router is the only thing the pages call. It also decides when *not* to call the AI: empty prompt, prompt longer than 300 characters, AI disabled, budget exhausted, or offline.

## 5.6 Validation gate and repair loop

Every AI response passes through, in this order:

1. **Shape check** — the response matches the declared schema; unknown keys dropped.
2. **Enum check** — any value outside `catalog.js` is **discarded, not corrected**.
3. **Clamps** — `validateGameDefinition()` after applying the actions.
4. **Sanity limits** — at most 6 objects, at most 8 actions per response, title ≤ 50 characters.

If any gate fails, send the validator's error list back to Claude **once** with an instruction to fix it. Two failures → return `intent: "CLARIFY"` with a friendly Hebrew message and chips. **The child must never see a stack trace, an English error, or a broken game.**

Log the technical detail to the server console in development only.

## 5.7 Cost, rate limiting and graceful degradation

- **The master AI switch (§6) is the authority.** When it is off — or when `ANTHROPIC_API_KEY` is missing — the app runs on tiers 1–2 and **nothing regresses**. This must be verified as an explicit test. The switch is read server-side on every AI request, so a client that lies about it changes nothing.
- Rate limiting and the daily caps are defined in **§6.4** and implemented in `src/ai/state.js`. Do not implement a second limiter here.
- On exhaustion the robot says `robot.tired` in Hebrew and tiers 1–2 keep working.
- Log per call: timestamp, mode, source tier, model, input/output/cache-read tokens, latency, repaired yes/no. These feed the ring buffer behind `/api/ai/log` (§6.4) — write them once, in one place, and do not build a second stats endpoint.

## 5.8 Wiring the pages

- `src/app/page.js` — replace the inline speech hook and translate helper with `<VoicePrompt>`; route submissions through `BrainRouter` in `create` mode; show `robot.thinking` while working.
- `src/app/games/[gameId]/page.js` — same, in `modify` mode; keep the existing history/undo/autosave logic unchanged; a `CLARIFY` response appends a robot message and changes nothing else.
- `src/components/robot/RobotChat.js` — renders `<RobotBubble>` and `<VoicePrompt>`; owns no speech or translation logic of its own.

## 5.9 Persistence changes

- Chat messages gain `lang` and optional `textHe` / `textEn`.
- History entries gain `promptHe` alongside `prompt`.
- Titles become `{ he, en }`, with a migration that wraps existing string titles.
- **Bump the storage key to `benmaorgal-games-v2`** and migrate `benmaorgal-games-v1` on first read. Keep the v1 blob under `legacyDefinition` for one release. Corrupt entries are skipped, never fatal.
- The repository interface (`getGames / getGame / saveGame / deleteGame / createGame`) does not change.

## 5.10 Phase 1 definition of done

- `npm run build` passes.
- With `ANTHROPIC_API_KEY` set, a phrase the app has never seen produces a correct, validated change or one short Hebrew clarifying question.
- With the key removed, the app still works fully on tiers 1–2.
- No API key, model name or prompt text is reachable from the browser bundle. Verify by searching the built client chunks.
- Every AI response is validated before it touches the engine; a deliberately corrupted response cannot break the game.

---

# 6. THE AI SWITCH — A SECRET URL BACKED BY A SHARED KV FLAG

AI capability is turned on and off at runtime by **visiting a secret link**. The state is **global**: one visit changes the behaviour for every user and every device, immediately, with no redeploy.

- **OFF** → the app behaves exactly as Phase 0: phrasebook + local regexes only. No Anthropic call is ever made, from any route.
- **ON** → full Phase 1 behaviour, all three tiers.

```
https://www.benmaorgal.com/api/ai?key=<ADMIN_KEY>&on=1    → AI on,  globally
https://www.benmaorgal.com/api/ai?key=<ADMIN_KEY>&on=0    → AI off, globally
```

The owner bookmarks both links. Toggling is one tap, from any device.

## 6.1 The store

The flag lives in a **Redis-compatible KV store reached over its REST API with `fetch`** — no npm client, no SDK. Adding "Upstash for Redis" from the Vercel Marketplace to this project is the least-friction path; it injects the connection variables automatically. Verify the exact injected variable names in the Vercel dashboard and use those; the names below are the current convention.

```
KV_REST_API_URL
KV_REST_API_TOKEN
```

Two keys are used, and nothing else:

| Key | Purpose |
|---|---|
| `benmaorgal:ai` | `"on"` \| `"off"` — the master switch |
| `benmaorgal:calls:<YYYY-MM-DD>` | global request counter for the day, 48-hour TTL |

REST shapes: read `GET {url}/get/{key}` → `{"result":"..."}`; write `POST {url}/set/{key}/{value}`; counter `POST {url}/pipeline` with `[["INCR", key], ["EXPIRE", key, 172800]]`. Always `cache: 'no-store'`, always `Authorization: Bearer <token>`. Use **POST for writes** so no intermediary can cache them.

## 6.2 Reference implementation — state and cap

```js
// src/ai/state.js — the ONLY place AI enablement and the global cap are decided
const BASE = process.env.KV_REST_API_URL
const TOK  = process.env.KV_REST_API_TOKEN
const FLAG = 'benmaorgal:ai'

let cache = { value: false, at: 0 }
const TTL_MS = 30_000

async function kv(path, method = 'GET', body) {
  const r = await fetch(`${BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`kv ${r.status}`)
  return (await r.json()).result
}

export async function getAiState() {
  if (Date.now() - cache.at < TTL_MS) return cache.value
  const on = (await kv(`get/${FLAG}`)) === 'on'
  cache = { value: on, at: Date.now() }
  return on
}

export async function setAiState(on) {
  await kv(`set/${FLAG}/${on ? 'on' : 'off'}`, 'POST')
  cache = { value: on, at: Date.now() }
}

// Counts the attempt BEFORE the Anthropic call, so a failed call still costs a slot.
export async function bumpGlobalCount() {
  const key = `benmaorgal:calls:${new Date().toISOString().slice(0, 10)}`
  const [count] = await kv('pipeline', 'POST', [['INCR', key], ['EXPIRE', key, 172800]])
  return Number(count?.result ?? count)
}

export async function aiEnabled() {
  if (!process.env.ANTHROPIC_API_KEY || !BASE || !TOK) return false
  try {
    return await getAiState()
  } catch {
    return false            // store unreachable → fail closed, never fail open
  }
}
```

The 30-second memory cache is what stops the flag adding a round-trip to every request. Consequence to document in the code: after a flip, the instance that handled it is correct immediately and other warm instances catch up **within 30 seconds**. That is acceptable; do not "fix" it by removing the cache.

## 6.3 Reference implementation — the switch route

```js
// src/app/api/ai/route.js
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { setAiState } from '@/ai/state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEqual(a, b) {
  const x = Buffer.from(a || ''), y = Buffer.from(b || '')
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  if (!process.env.ADMIN_KEY || !safeEqual(searchParams.get('key'), process.env.ADMIN_KEY)) {
    return new NextResponse('Not found', { status: 404 })
  }
  await setAiState(searchParams.get('on') === '1')
  const res = NextResponse.redirect(`${origin}/`)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}
```

Notes for the implementer:

- A wrong or missing key returns **404**, never 401 or 403. The route must not reveal that it exists.
- `ADMIN_KEY` must be at least 40 random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `aiEnabled()` is the **only** implementation of this check. No route re-derives it.
- There is **no cookie** anywhere in this design.

## 6.4 The global daily cap — now a real guarantee

Because the counter is shared, the daily ceiling is genuinely enforceable rather than a per-instance approximation.

- `AI_DAILY_LIMIT` (default `300`) — **global** AI requests per UTC day, counted in KV.
- `AI_DEVICE_DAILY_LIMIT` (default `100`) — per-device backstop, keyed on the `deviceId` the client stores in `localStorage`. In-memory is fine for this one; it only guards against one device monopolising the global budget.

`bumpGlobalCount()` runs **before** the Anthropic call. Over the limit → the robot says `robot.tired` in Hebrew, tiers 1–2 keep working, and no paid call is made. A KV error anywhere in this path is treated exactly like "AI is off".

## 6.5 Enforcement points

Every one of these calls `aiEnabled()` server-side, first, before doing any work:

- **`/api/robot`** — if AI is off or the cap is exhausted, return `intent: "CLARIFY"` with the Hebrew `robot.offline` / `robot.tired` message and three working chips. **Never call Anthropic.**
- **`/api/translate`** — if AI is off, skip the Claude step and fall through phrasebook → cache → MyMemory → passthrough.
- **`GET /api/ai-status`** — returns `{ "enabled": true|false }` and nothing else. No model names, no limits, no counts, no key material.

`BrainRouter` reads `/api/ai-status` once per page load (refreshing on window focus) purely to skip a doomed round-trip. **This is an optimisation, never the enforcement.** A client that lies about the status changes nothing, because the server re-checks.

## 6.6 The public-site consequence — read this

The switch is global and benmaorgal.com is a public site. **While AI is on, any visitor can trigger paid calls.** This is the deliberate trade for a global switch, and it is why §6.4 is not optional.

Required mitigations, all in this task:

1. The global daily cap above — the hard ceiling on a day's spend.
2. The per-device cap — stops one visitor consuming the whole budget.
3. **Off is the default.** A fresh deploy, an empty KV and any store failure all mean off. There is no configuration in which the app comes up with AI already on.
4. Prompt length capped at 300 characters, and one AI request in flight per client at a time.

## 6.7 Usage visibility

```
GET /api/ai/log?key=<ADMIN_KEY>
```

Same 404-on-wrong-key rule. Returns JSON: the current global count for today, the switch state, and the last 50 AI calls with timestamp, Hebrew text, English text, mode, tier used, intent returned, latency, token counts and repaired yes/no. This doubles as parent visibility — it is how the owner sees what the child has been asking.

The call list is an in-memory ring buffer. **Say plainly in a code comment that it is per-instance and lost on cold start** — it is a spot check, not an audit log. The global count, being in KV, is accurate. Do not build a second stats endpoint; this is the only one.

## 6.8 Security requirements

1. The Anthropic key, `ADMIN_KEY` and the KV token are read only inside server route handlers. None may appear in any client bundle, in `/api/ai-status`, or in any response body.
2. No secret is ever logged, including in error paths and including `/api/ai/log` output.
3. A wrong or absent key on `/api/ai` and `/api/ai/log` returns **404**.
4. Both routes carry `X-Robots-Tag: noindex, nofollow`.
5. Key comparisons use `timingSafeEqual`, never `===`.
6. The child-facing app contains no link, hint or route reference to `/api/ai`.
7. Any KV error fails **closed**. There must be no code path in which a store failure enables AI.

## 6.9 Definition of done

- With `benmaorgal:ai` unset or `"off"`, the app runs in Phase 0 mode. Verified by watching the network tab: **zero** requests reach Anthropic.
- Visiting the `on=1` link enables AI **on a different device and a different browser** within 30 seconds, with no redeploy.
- Visiting the `on=0` link disables it globally the same way.
- A wrong key returns 404 and changes nothing.
- With the KV token deliberately broken, the app falls back to Phase 0 and keeps working.
- The global cap refuses the (N+1)th call of the day while tiers 1–2 continue to work.
- Searching the built client bundle finds none of `ANTHROPIC_API_KEY`, `ADMIN_KEY`, `KV_REST_API_TOKEN`.

## 6.10 Deliberately deferred

A full admin page — password login, sub-switches for modify / create / translate, an editable limit and a persistent dashboard — is a **Phase 3** item and is **not** to be built now.

When it is built it layers on top of this mechanism without changing it: the page writes the same KV keys, and `aiEnabled()` is untouched. Keep that seam clean — `src/ai/state.js` stays the one place these decisions are made.

---

# 7. ENVIRONMENT AND DEPLOYMENT

`.env.local` for development, Vercel project settings for Production and Preview:

```
# --- Anthropic ---
ANTHROPIC_API_KEY=sk-ant-...
ROBOT_MODEL=<current Claude Sonnet model id>
TRANSLATE_MODEL=<current Claude Haiku model id>

# --- The AI switch (§6) ---
ADMIN_KEY=<40+ random chars — the secret in the toggle URL>
KV_REST_API_URL=<injected by the KV integration>
KV_REST_API_TOKEN=<injected by the KV integration>
AI_DAILY_LIMIT=300              # global, per UTC day
AI_DEVICE_DAILY_LIMIT=100       # per device

# --- Fallback translation ---
TRANSLATE_CONTACT_EMAIL=<email, lifts the MyMemory anonymous quota>
```

Generate `ADMIN_KEY` with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the KV store from the Vercel Marketplace ("Upstash for Redis" or equivalent) and let it inject its connection variables; confirm the injected names match the two above and use whatever the dashboard actually provides.

There is no `AI_ENABLED` variable. AI is **off unless the KV flag says `"on"`**, so a fresh deploy, an empty store and any store failure all start in Phase 0 mode.

- No AI or secret variable may ever be prefixed `NEXT_PUBLIC_`.
- Document every variable in `README.md`, including how to generate `ADMIN_KEY` and the two bookmark URLs.
- Route handlers: `export const runtime = 'nodejs'` and `export const maxDuration = 30`.
- Confirm `/api/ai`, `/api/ai-status`, `/api/ai/log`, `/api/robot` and `/api/translate` are dynamic — not statically optimised, not cached by Vercel or by the browser.
- The KV store must be in the same region as the functions where possible, to keep the flag read cheap.

---

# 8. CONSTRAINTS — READ TWICE

1. **No new npm dependencies.** Anthropic and the KV store are reached with `fetch`, the key check with `node:crypto`. No SDK, no i18n library, no auth library, no JWT library, no UI library, **no KV client package** — the REST API only.
2. **No TypeScript.** No framework migration.
3. **No `eval`, no `new Function`, no AI-generated JavaScript, ever.**
4. **Do not touch `public/battle/**` or the `/game → /battle` redirects.**
5. Do not access `localStorage` during server rendering, and do not create hydration mismatches with the RTL `dir` attribute.
6. Do not break existing saved games — the v1 → v2 migration must be tested against real localStorage data.
7. Keep the deterministic tiers intact. **The AI is the safety net, not the hot path.** If a change makes the app need the network to do something simple, it is wrong.
8. No fake delays. The robot animation may cover real latency; it must never manufacture it.
9. Do not build an admin page or a login form in this task (§6.10). The switch is the secret URL and the KV flag, nothing more.
10. Comments only where they earn their place. Match the existing style (no semicolons, ES modules).

---

# 9. ACCEPTANCE TESTS

Primary target: **Google Chrome** (desktop and Android). Run the spoken tests out loud, in Hebrew, on the real device.

## 9.1 Phase 0 — AI switch OFF, or no API key

| # | Say / do | Expected |
|---|---|---|
| 1 | Open a Catch game, tap 🎤, say **"תעשה שאני אלך יותר מהר"** | Hebrew transcript bubble appears; prompt box fills with `make the player faster`; Send → player visibly faster; Hebrew reply spoken aloud |
| 2 | **"תוסיף פצצות"** | Bombs fall and cost a life |
| 3 | **"תן לי עשרה חיים"** | HUD shows 10 |
| 4 | **"רקע של חלל"** | Space background |
| 5 | Tap ↩ בטל | Previous version restored, game reloads |
| 6 | Tap a Hebrew suggestion chip | Behaves exactly like speaking it |
| 7 | Reload the browser | Game, title, history and chat survive |
| 8 | Disable the network after load, repeat tests 1–4 | All still work — tier 1 needs no network |
| 9 | Toggle 🔇 | Robot stops speaking; preference survives reload |
| 10 | Open in a browser with no `SpeechRecognition` (e.g. Firefox) | Mic hidden, Hebrew hint shown, typing and chips work. Smoke check only — Chrome is the supported target |

## 9.2 Phase 1 — AI switch ON, key configured

| # | Say / do | Expected |
|---|---|---|
| 11 | **"תעשה שהכוכבים יזוזו בזיגזג"** | `MODIFY_OBJECT` with `motion: zigzag`. **Never** a silent background decoration |
| 12 | **"תעשה שהמשחק ייגמר אחרי דקה"** | `rules.timeLimit = 60`, countdown in the HUD |
| 13 | **"תעשה שהכוכבים ייפלו לאט אבל שיהיו הרבה"** | Two coherent changes in one response (speed down, spawnRate down) |
| 14 | Home page: **"תעשה משחק שבו כלב תופס עצמות ביער"** | Catch template, dog player, bone collectible, forest background, playable in under 5 s |
| 15 | **"מה השעה?"** | `CLARIFY` — one short Hebrew question redirecting to game-making. No game change |
| 16 | Feed a deliberately corrupted AI response (temporary test hook) | Repair loop runs once, then a friendly Hebrew fallback. Game unchanged, no crash, no English error |
| 17 | Set the daily limit to 1 in admin, send two AI prompts | Second returns `robot.tired` in Hebrew; tiers 1–2 still work |

## 9.3 The AI switch

| # | Do | Expected |
|---|---|---|
| 18 | Empty KV / flag `"off"`, use the child app with the network tab open | Phase 0 behaviour. **Zero** requests to Anthropic |
| 19 | Visit `/api/ai?key=<ADMIN_KEY>&on=1` | Redirects to `/`; AI available immediately on that browser |
| 20 | **On a second device and a different browser**, reload within 30 s | AI is on there too — the switch is global |
| 21 | Visit `/api/ai?key=<ADMIN_KEY>&on=0`, then check both devices | AI off everywhere within 30 s; app identical to §9.1 |
| 22 | Visit `/api/ai?key=wrong&on=1` | **404**, flag unchanged |
| 23 | Visit `/api/ai` with no parameters | **404** |
| 24 | Redeploy the app with the flag on | Setting survives — it lives in KV, not in the deployment |
| 25 | Break `KV_REST_API_TOKEN`, reload | App falls back to Phase 0 and keeps working. **No path enables AI on a store error** |
| 26 | Set `AI_DAILY_LIMIT=2`, send three AI prompts from two different devices | Third is refused with `robot.tired`; the count is shared, not per-device |
| 27 | Set `AI_DEVICE_DAILY_LIMIT=1`, send two prompts from one device | Second refused; a different device can still use the remaining global budget |
| 28 | `GET /api/ai/log?key=<ADMIN_KEY>` after the §9.2 tests | Switch state, today's global count, and the last 50 calls with Hebrew, English, mode, tier, intent, latency, tokens. Wrong key → 404 |
| 29 | Search the built client bundle for `ANTHROPIC_API_KEY`, `ADMIN_KEY`, `KV_REST_API_TOKEN` | None present |
| 30 | Grep the child-facing app for `/api/ai?` | No links or references |

## 9.4 Regression

| # | Check |
|---|---|
| 29 | All 12 templates: create, play, restart, modify, reload, delete |
| 30 | `/battle` and `/battle/lobby.html` load and play |
| 31 | `/game` still redirects to `/battle` |
| 32 | Desktop 1920×1080, laptop 1366×768, tablet, phone — game comfortably playable, touch targets ≥ 48 px |
| 33 | An existing `benmaorgal-games-v1` localStorage payload migrates without loss |

---

# 10. FINAL REPORT

When done, produce a concise report covering:

1. What changed, file by file, grouped by Phase 0 / Phase 1 / switch.
2. Which of the defects B1–B6 were fixed, and how each was verified.
3. The final action catalog and every new definition field, with ranges.
4. The exact `/api/robot`, `/api/translate`, `/api/ai-status`, `/api/ai` and `/api/ai/log` contracts as implemented.
5. Phrasebook coverage — how many patterns, and what still falls through to the AI.
6. Measured latency per tier, and measured token usage per request with and without prompt caching.
7. The switch as built: the two routes, the KV keys, the cache TTL and observed propagation delay, the 404-on-wrong-key behaviour, and confirmation of every §6.8 security requirement.
8. Confirmation that AI is off by default — fresh deploy, empty store, broken store token — and what the child sees in each case. Plus how both daily caps were verified.
9. Confirmation that `npm run build` passes, that the app runs with the switch off, and that it runs with no API key at all.
10. Known limitations and anything deferred.
11. What is now ready for Phase 2 (GameSpec v2 + RecipeRuntime) and which seams it plugs into.
12. Local run commands, the full environment variable list, how to generate `ADMIN_KEY`, and the two ready-to-bookmark toggle URLs.

---

# 11. GUIDING PRINCIPLES

1. The child talks to a robot in Hebrew, and the robot answers in Hebrew, out loud.
2. The English text is shown, not hidden — he can see what the robot heard, and he learns a little English.
3. The frequent commands are instant and free. The AI handles the rest.
4. The AI produces validated data, never code.
5. Every change is reversible with one tap.
6. Nothing the AI does can break the game, empty the wallet, or show an error in English.
7. When in doubt, the robot asks one short Hebrew question rather than guessing.
8. **With the AI switched off the app is still a complete, working product** — Phase 0 is not a degraded mode, it is the floor.
