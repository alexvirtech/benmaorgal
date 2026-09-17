# DEVELOPMENT TASK

## BenMaorGal — AI Admin, Budget & Usage Phase

Upgrade the existing **BenMaorGal Game-Making Robot** with a production-ready AI usage management system: a visible AI toggle in the main navigation, monthly dollar-based budget enforcement, real-time usage monitoring in the admin dashboard, and visual AI-mode indicators throughout the UI.

Target site: **https://www.benmaorgal.com**
Repository root: this project (Next.js 15 App Router, React 19, plain JavaScript, Vercel).

Read `doc/AI-Upgrade-Concept.md` and `doc/Claude Code Prompt — AI Upgrade Phase 0-1.md` first for full architectural context. This task **builds on top of the completed Phase 0 + Phase 1** work.

---

# 0. INSPECT BEFORE CHANGING

1. Read the whole repository before editing anything.
2. Run `npm install && npm run dev` and confirm the app works today.
3. Confirm `/battle` and `/battle/lobby.html` still load.
4. Confirm the admin page (`/admin`) works: Google Sign-In, AI toggle, daily call count.
5. Confirm all 12 game templates play correctly with AI both on and off.
6. **Do not delete or rewrite existing working code.** This is an upgrade, not a rewrite.
7. Commit in logical steps so any single change can be reverted.

---

# 1. DECISIONS ALREADY TAKEN — DO NOT RE-LITIGATE

| Decision | Value |
|---|---|
| AI provider | **Anthropic Claude**, called server-side from Next.js route handlers |
| AI output | **Structured JSON only** (GameActions). The AI never writes JavaScript. |
| Dependencies | **Zero new npm packages.** No chart library, no dashboard framework, no UI kit. Build everything with plain CSS + React. |
| Language | **Plain JavaScript.** No TypeScript. |
| Style | ES modules, no semicolons (match existing code), small modules |
| State store | **Upstash Redis REST API via fetch** (existing KV integration). No SDK, no additional database. |
| Admin auth | **Google Sign-In** (existing — `GOOGLE_CLIENT_ID` + `ADMIN_EMAIL` env vars). No new auth system. |
| AI toggle visibility | The on/off switch moves into the **main navigation bar**, left corner. The admin page retains a toggle too, alongside the new monitoring features. |
| Budget currency | **US Dollars ($)** — the admin sets a monthly dollar ceiling. The system converts it to an estimated request count using real usage data. |
| Pricing model | Based on **Anthropic Claude API pricing** at the models configured in `ROBOT_MODEL` and `TRANSLATE_MODEL`. The system tracks actual token usage per request and computes estimated cost. |

---

# 2. WHAT MUST WORK WHEN YOU ARE DONE

## 2.1 — The AI toggle in the navigation

The parent or child taps a clearly labelled AI switch in the **left corner** of the top navigation bar. The switch reads and writes the existing global AI state (`benmaorgal:ai` KV flag). When toggled:

- **ON**: The BrainRouter uses all three tiers (phrasebook → local → Claude). Example prompts from `ExamplesModal` and free-text prompts in the "what to change" textarea both flow through the full AI pipeline. The navigation bar and the robot chat header display a visual AI-active indicator (see §4).
- **OFF**: Only phrasebook + local regex tiers operate. No Anthropic API calls are made. The visual indicator is absent. The app remains fully functional.

The toggle must call `/api/ai-status` to read the current state and a **new authenticated endpoint** to write it, using the existing admin Google token or the existing `ADMIN_KEY` secret. The child should be able to **see** the toggle state (visual feedback) but **not change it** without admin credentials. See §3.5 for the full specification.

## 2.2 — The admin dashboard

The admin page at `/admin` shows, after Google Sign-In:

1. **AI ON/OFF toggle** — the existing toggle, kept and enhanced (see §5.1)
2. **Monthly budget setting** — a dollar input where the admin sets the maximum monthly AI spend (see §5.2)
3. **Usage monitor** — a real-time dashboard showing:
   - Current month's estimated spend vs. budget (visual gauge)
   - Requests used this month vs. estimated maximum (derived from budget)
   - Daily usage sparkline for the last 30 days
   - Cost breakdown by request type (game modify / game create / translate)
   - Average cost per request (computed from actual token usage)
   - Days remaining in the billing period
4. **Request log** — the last 50 AI calls with timestamp, Hebrew prompt, English prompt, mode, tier, tokens, latency, cost estimate (see §5.5)

## 2.3 — Budget enforcement

When the estimated monthly spend reaches the budget ceiling, AI is **automatically disabled** for the remainder of the month. The child sees `robot.tired` in Hebrew, tiers 1–2 keep working, and no further paid calls are made until the next calendar month (or until the admin raises the budget).

---

# 3. THE AI TOGGLE IN THE NAVIGATION BAR

## 3.1 Placement

The AI switch sits in the **left corner** (in RTL: right side visually) of the navigation bar, between the brand logo and the navigation links. It must be:

- Always visible on desktop and mobile (not hidden in the hamburger menu)
- Clearly labelled: `🤖 AI` with a toggle pill/switch
- Compact: must not push other nav items to overflow

## 3.2 Visual states

| State | Appearance |
|---|---|
| AI OFF | Grey/muted toggle pill, no glow, label reads `AI` in muted text |
| AI ON | Green/accent toggle pill with a subtle pulse animation, label reads `AI` in bright text |
| Loading | Toggle is disabled with a brief spinner while the state is being fetched or written |
| Budget exhausted | Toggle shows ON but with an amber/warning colour and a tooltip/label: "Budget reached" |
| KV unavailable | Toggle is disabled and greyed out; tooltip: "Service unavailable" |

## 3.3 Behaviour for non-admin users (the child)

The toggle is **read-only** for non-admin users:

- It displays the current AI state (green = on, grey = off)
- Tapping it shows a brief, friendly Hebrew tooltip: `"רק אבא יכול להפעיל את זה"` ("Only dad can turn this on")
- It does NOT attempt to write to the KV store
- The visual AI-mode indicators (§4) still show/hide based on the state

## 3.4 Behaviour for admin users

When the admin is signed in (Google token stored in `sessionStorage` on the admin page), the toggle becomes functional:

- Tapping it calls the authenticated toggle endpoint
- A brief loading state shows during the KV write
- On success, the visual indicators update immediately
- The admin page and the nav toggle share the same auth state (see §3.5)

**Practical approach:** Since Google Sign-In state is page-scoped and the nav bar appears on every page, do NOT require Google Sign-In in the nav. Instead:

- The nav toggle is **always read-only** — it shows the AI state but does not toggle it
- Toggling AI is done from the **admin page** only (where the user is already authenticated)
- The nav toggle acts as a **persistent visual indicator** across all pages
- Add a small admin link icon (🔧) next to the toggle that navigates to `/admin` — visible only, never prominent

This avoids auth complexity in the nav while keeping the AI state visible everywhere.

## 3.5 Implementation

### Client-side: `src/components/layout/AiToggle.js`

A new component used by `Navigation.js`:

```js
<AiToggle />
```

- Fetches `/api/ai-status` on mount and on `window.focus`
- Polls every 60 seconds (matching the existing `STATUS_TTL` in `BrainRouter.js`)
- Renders a toggle pill with the visual states from §3.2
- Emits a custom event `ai-status-changed` on `window` so other components (e.g., the chat header) can react without re-fetching
- The event is also fired when the admin page toggles AI (via `BroadcastChannel` or `storage` event)

### Navigation update: `src/components/layout/Navigation.js`

- Import and render `<AiToggle />` as the first item in the nav bar (before the brand link)
- On mobile, keep it visible outside the hamburger menu

### Status endpoint — no change

`GET /api/ai-status` already returns `{ enabled: boolean }` and is public. Keep it.

### Budget status — new field

Extend `GET /api/ai-status` to also return:

```json
{
  "enabled": true,
  "budgetExhausted": false
}
```

The `budgetExhausted` flag lets the toggle show the warning state (§3.2) without exposing dollar amounts or counts publicly.

---

# 4. VISUAL AI-MODE INDICATORS

When AI is enabled, the UI must clearly show that "the robot is powered up" — both as user feedback and as a signal to the parent that paid API calls are active.

## 4.1 Recommended approach: accent border glow + badge

Do **not** change the panel background colours (this would harm readability and visual consistency). Instead:

### Navigation bar

When AI is ON, add a subtle animated gradient bottom-border to the nav:

```css
.nav.ai-active {
  border-bottom: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
}
.nav.ai-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--primary), var(--accent));
  background-size: 200% 100%;
  animation: ai-glow 3s ease-in-out infinite;
}
@keyframes ai-glow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Robot chat header

When AI is ON, the chat header (the purple gradient bar with 🤖) gains:

- A small `✨ AI` badge next to the robot emoji, in accent colour
- The same animated bottom-border as the nav

### Robot bubbles

When a response came from the AI tier (not phrasebook or local), show a tiny `🤖✨` indicator on the bubble, so the parent can see which answers used paid AI.

## 4.2 Implementation

Add a CSS class `.ai-active` to the nav and chat header containers. Toggle it based on the AI status from `AiToggle`'s shared state (custom event or React context).

Create a lightweight React context `AiStatusContext` in `src/components/layout/AiStatusProvider.js`:

```js
// provides { aiEnabled, budgetExhausted } to all children
// fetches /api/ai-status on mount, focus, and every 60s
// fires window event on change for non-React consumers
```

Wrap the app layout in this provider. `AiToggle`, `RobotChat`, `Navigation`, and any component that needs AI status reads from this context instead of making independent fetches.

## 4.3 Dark mode / accessibility

- The glow animation must respect `prefers-reduced-motion`: replace animation with a static accent-coloured border.
- The AI badge must not rely on colour alone: the `✨ AI` text provides a non-colour signal.
- Ensure sufficient contrast for the badge against both the purple chat header and the white nav bar.

---

# 5. ADMIN DASHBOARD — STATISTICS, BUDGET & MONITORING

The admin page (`/admin`) retains Google Sign-In authentication. After sign-in, the page now shows a full AI management dashboard.

## 5.1 Section 1 — AI Control (existing, enhanced)

Keep the existing layout: admin email, AI ON/OFF toggle, sign-out button.

**Enhancement:** When AI is ON and the budget is exhausted, show a warning banner:

```
⚠️ Monthly budget reached — AI is paused until next month
```

with a button to increase the budget inline.

## 5.2 Section 2 — Monthly Budget Setting

A card titled **"Monthly AI Budget"** containing:

- A numeric input for the dollar amount (e.g., `$5.00`), minimum `$0.50`, step `$0.50`
- A **"Save"** button that writes the value to KV
- Below the input, a computed display:
  - "≈ **{N} requests** this month" — estimated from the budget divided by the average cost per request
  - "Average cost per request: **${X.XXXX}**" — computed from actual historical token usage
  - If no history yet: "Estimated ~**{N} requests** (based on typical usage of ~$0.015/request)"

### KV keys

| Key | Value | TTL |
|---|---|---|
| `benmaorgal:budget:monthly` | Dollar amount as string, e.g. `"5.00"` | none (persistent) |
| `benmaorgal:budget:month-start` | ISO date of budget period start, e.g. `"2026-09-01"` | none |

### Default budget

If no budget is set in KV, default to `$5.00`. This ensures the system has a ceiling even before the admin configures it. The default is documented in the UI: *"Default: $5.00/month — change it above."*

### Cost estimation formula

```
averageCostPerRequest = totalMonthTokenCost / totalMonthRequests
estimatedMaxRequests = monthlyBudget / averageCostPerRequest
```

Where `totalMonthTokenCost` is computed from actual token counts using the pricing constants (§5.6).

## 5.3 Section 3 — Usage Monitor

A card titled **"This Month's Usage"** containing:

### 5.3.1 Budget gauge (the centrepiece)

A horizontal progress bar showing **estimated spend vs. budget**:

```
 [$2.34 of $5.00]  ████████████░░░░░░░░░  47%
```

Colour thresholds:
- 0–50%: green (`--success`)
- 50–80%: amber (`--warning`)
- 80–100%: red (`--danger`)

Below the gauge:
- Left: `$X.XX spent (est.)` | Right: `$X.XX remaining`
- Centre: `{N} of ~{M} requests used`

### 5.3.2 Key metrics row

Four compact stat cards in a row:

| Card | Value | Subtitle |
|---|---|---|
| Requests | `{N}` | This month |
| Est. Spend | `${X.XX}` | This month |
| Avg Cost | `${X.XXXX}` | Per request |
| Days Left | `{N}` | In billing period |

### 5.3.3 Daily usage chart

A simple bar chart (no library — pure CSS/SVG) showing the last 30 days of request counts:

- X axis: dates (show every 5th label)
- Y axis: request count
- Bars coloured by the budget threshold (green/amber/red)
- Today's bar highlighted
- Hover shows exact count + estimated cost for the day

Implementation: a `<svg>` element with `<rect>` bars, rendered server-side as data from the API. No chart library.

### 5.3.4 Breakdown by type

A simple three-row table:

| Type | Requests | Tokens (in/out) | Est. Cost |
|---|---|---|---|
| Game modify | 145 | 850K / 72K | $1.82 |
| Game create | 23 | 180K / 45K | $0.61 |
| Translate | 89 | 45K / 12K | $0.18 |
| **Total** | **257** | **1.07M / 129K** | **$2.61** |

## 5.4 Section 4 — Alert Thresholds

A card titled **"Alerts"** with three configurable percentage thresholds that trigger visual warnings:

| Threshold | Default | Behaviour |
|---|---|---|
| Info | 50% | Gauge turns amber |
| Warning | 80% | Gauge turns red, admin page shows a banner |
| Limit | 100% | AI auto-pauses, `robot.tired` message for the child |

These are stored in KV:

| Key | Value |
|---|---|
| `benmaorgal:budget:alert-warn` | `"80"` (percentage) |
| `benmaorgal:budget:alert-limit` | `"100"` (percentage, should generally stay 100) |

For the first version, keep thresholds fixed at 50/80/100 — do not build a UI for editing them. Document them as future-configurable.

## 5.5 Section 5 — Request Log

The existing in-memory ring buffer (`src/ai/log.js`, last 50 calls) is displayed as a table:

| Time | Hebrew | English | Type | Tier | Tokens | Latency | Cost (est.) |
|---|---|---|---|---|---|---|---|
| 14:32 | תוסיף פצצות | add bombs | modify | phrasebook | — | 0ms | $0 |
| 14:33 | תעשה שהכוכבים יזוזו | make stars zigzag | modify | claude | 6.2K/480 | 1.8s | $0.019 |

Notes:
- Phrasebook and local tier calls show `$0` cost and no token count
- Claude tier calls show input/output tokens and estimated cost
- Rows are colour-coded: green for free tiers, purple for Claude
- The log is per-instance and lost on cold start — note this in the UI: *"Recent calls (this server instance only)"*
- For **persistent monthly statistics**, use the KV-backed counters (§6), not this log

## 5.6 Pricing Constants

Create `src/ai/pricing.js`:

```js
// Anthropic Claude pricing per million tokens (as of 2026-09)
// Update these when model pricing changes
export const PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00,       // $/M input tokens
    output: 15.00,     // $/M output tokens
    cacheRead: 0.30,   // $/M cache-read input tokens
    cacheWrite: 3.75,  // $/M cache-write tokens
  },
  'claude-haiku-4-5-20251001': {
    input: 0.80,
    output: 4.00,
    cacheRead: 0.08,
    cacheWrite: 1.00,
  },
}

// Fallback for unknown models — use Sonnet pricing as conservative estimate
export const DEFAULT_PRICING = PRICING['claude-sonnet-4-20250514']

export function estimateCost(usage, model) {
  const p = PRICING[model] || DEFAULT_PRICING
  const input = ((usage.inputTokens || 0) / 1_000_000) * p.input
  const output = ((usage.outputTokens || 0) / 1_000_000) * p.output
  const cacheRead = ((usage.cacheReadTokens || 0) / 1_000_000) * p.cacheRead
  return input + output + cacheRead
}
```

Keep model IDs as keys so the pricing resolves automatically from the `model` field already logged per call. When model IDs in env vars change, add the new entry. The fallback ensures unknown models still get a cost estimate.

---

# 6. MONTHLY TRACKING IN KV

The existing KV tracks daily counts only (`benmaorgal:calls:YYYY-MM-DD`, 48h TTL). Monthly budget enforcement requires durable monthly aggregates.

## 6.1 New KV keys

| Key | Value | TTL | Purpose |
|---|---|---|---|
| `benmaorgal:month:YYYY-MM:requests` | integer | 45 days | Total AI requests this month |
| `benmaorgal:month:YYYY-MM:tokens:in` | integer | 45 days | Total input tokens this month |
| `benmaorgal:month:YYYY-MM:tokens:out` | integer | 45 days | Total output tokens this month |
| `benmaorgal:month:YYYY-MM:tokens:cache` | integer | 45 days | Total cache-read tokens this month |
| `benmaorgal:month:YYYY-MM:cost:est` | string (cents) | 45 days | Running estimated cost in cents (integer for precision) |
| `benmaorgal:month:YYYY-MM:by-type:modify` | integer | 45 days | Modify requests this month |
| `benmaorgal:month:YYYY-MM:by-type:create` | integer | 45 days | Create requests this month |
| `benmaorgal:month:YYYY-MM:by-type:translate` | integer | 45 days | Translate requests this month |
| `benmaorgal:month:YYYY-MM:daily:DD` | integer | 45 days | Per-day count within the month (for the chart) |
| `benmaorgal:budget:monthly` | string (dollars) | none | Budget ceiling |
| `benmaorgal:budget:alert-warn` | string (percentage) | none | Warning threshold |

**Key design:** 45-day TTL on monthly data means last month's stats are still visible for 2 weeks into the next month (for comparison), then auto-expire. No cleanup job needed.

## 6.2 State module extension: `src/ai/state.js`

Add to the existing module:

```js
export async function bumpMonthlyStats({ mode, usage, model }) {
  const ym = new Date().toISOString().slice(0, 7)   // "2026-09"
  const dd = new Date().getDate().toString()          // "17"
  const cost = estimateCostCents(usage, model)        // integer cents
  const TTL = 3888000                                 // 45 days in seconds

  const pipeline = [
    ['INCRBY', `benmaorgal:month:${ym}:requests`, 1],
    ['EXPIRE', `benmaorgal:month:${ym}:requests`, TTL],
    ['INCRBY', `benmaorgal:month:${ym}:tokens:in`, usage.inputTokens || 0],
    ['EXPIRE', `benmaorgal:month:${ym}:tokens:in`, TTL],
    ['INCRBY', `benmaorgal:month:${ym}:tokens:out`, usage.outputTokens || 0],
    ['EXPIRE', `benmaorgal:month:${ym}:tokens:out`, TTL],
    ['INCRBY', `benmaorgal:month:${ym}:tokens:cache`, usage.cacheReadTokens || 0],
    ['EXPIRE', `benmaorgal:month:${ym}:tokens:cache`, TTL],
    ['INCRBY', `benmaorgal:month:${ym}:cost:est`, cost],
    ['EXPIRE', `benmaorgal:month:${ym}:cost:est`, TTL],
    ['INCRBY', `benmaorgal:month:${ym}:by-type:${mode}`, 1],
    ['EXPIRE', `benmaorgal:month:${ym}:by-type:${mode}`, TTL],
    ['INCRBY', `benmaorgal:month:${ym}:daily:${dd}`, 1],
    ['EXPIRE', `benmaorgal:month:${ym}:daily:${dd}`, TTL],
  ]

  await kv('pipeline', 'POST', pipeline).catch(() => {})
}

export async function getMonthlyStats(yearMonth) {
  const ym = yearMonth || new Date().toISOString().slice(0, 7)
  // Fetch all monthly counters in one pipeline call
  // Return { requests, tokensIn, tokensOut, tokensCache, costCents, byType, daily }
}

export async function getMonthlyBudget() {
  // Returns { budgetDollars, warnPercent }
}

export async function setMonthlyBudget(dollars) {
  // Writes to benmaorgal:budget:monthly
}
```

**Critical:** `bumpMonthlyStats` runs in the same `try/catch` as the existing `bumpGlobalCount` — a failure never blocks the response or breaks the app. Stats are best-effort; the hard cap is still the monthly budget check.

## 6.3 Budget enforcement

Add a **monthly budget check** alongside the existing daily cap in `/api/robot`:

```js
// After the existing daily cap check:
const monthlyStats = await getMonthlyStats().catch(() => null)
const budget = await getMonthlyBudget().catch(() => ({ budgetDollars: 5 }))

if (monthlyStats) {
  const spentDollars = monthlyStats.costCents / 100
  if (spentDollars >= budget.budgetDollars) {
    return offlineResponse(
      'הרובוט צריך לנוח עד החודש הבא 😴',
      'The robot needs to rest until next month 😴'
    )
  }
}
```

Also enforce in `/api/translate` (Claude tier only) — when the budget is exhausted, skip to the MyMemory fallback instead of calling Claude.

## 6.4 Daily counter compatibility

The existing `benmaorgal:calls:YYYY-MM-DD` daily counters (48h TTL) are **kept**. They serve the existing daily cap (`AI_DAILY_LIMIT`). The new monthly counters are **additional**, not replacements. Both caps are checked: daily first, then monthly.

---

# 7. ADMIN API CHANGES

## 7.1 Extend `GET /api/admin/ai`

The existing endpoint returns `{ enabled, calls, email, kv }`. Extend it:

```json
{
  "enabled": true,
  "calls": 42,
  "email": "admin@example.com",
  "kv": true,
  "budget": {
    "monthlyDollars": 5.00,
    "spentCents": 234,
    "spentDollars": 2.34,
    "requests": 157,
    "estimatedMaxRequests": 333,
    "averageCostPerRequest": 0.0149,
    "budgetExhausted": false,
    "percentUsed": 46.8,
    "daysRemaining": 13
  },
  "monthly": {
    "yearMonth": "2026-09",
    "requests": 157,
    "tokensIn": 945000,
    "tokensOut": 78000,
    "tokensCache": 820000,
    "costCents": 234,
    "byType": {
      "modify": 102,
      "create": 18,
      "translate": 37
    },
    "daily": {
      "1": 12, "2": 8, "3": 15, "4": 0, "5": 9,
      "...": "...",
      "17": 7
    }
  },
  "log": []
}
```

**Notes:**
- `log` replaces the separate `/api/ai/log` endpoint for the admin page — it returns the same ring buffer data, now enriched with per-call cost estimates
- Keep `/api/ai/log?key=ADMIN_KEY` working as-is for backward compatibility (the bookmark-based admin flow)
- The `budget` object is computed server-side from the KV monthly stats + budget setting + pricing constants

## 7.2 New: `POST /api/admin/ai` body extensions

The existing POST accepts `{ enabled: boolean }`. Extend to also accept:

```json
{
  "enabled": true,
  "budget": 5.00
}
```

- If `budget` is present, write it to `benmaorgal:budget:monthly`
- Validate: minimum `0.50`, maximum `100.00`, must be a number
- Return the full extended response from §7.1

## 7.3 Extend `GET /api/ai-status`

Currently returns `{ enabled }`. Add `budgetExhausted`:

```json
{
  "enabled": true,
  "budgetExhausted": false
}
```

This is the only budget-related field exposed publicly. No dollar amounts, no request counts, no tokens.

---

# 8. ADMIN PAGE UI — DETAILED SPECIFICATIONS

## 8.1 Layout

After sign-in, the admin page shows a vertical stack of cards:

```
┌─────────────────────────────────────────┐
│  Admin — BenMaorGal                     │
│  admin@example.com            [Sign out] │
├─────────────────────────────────────────┤
│  🤖 AI Control                          │
│  [ON/OFF toggle]                [badge]  │
│  ⚠️ Budget warning banner (if needed)    │
├─────────────────────────────────────────┤
│  💰 Monthly Budget                       │
│  [$___5.00___] [Save]                    │
│  ≈ 333 requests this month               │
│  Avg cost: $0.0149/request               │
├─────────────────────────────────────────┤
│  📊 This Month's Usage                   │
│  [$2.34 of $5.00]                        │
│  ████████████░░░░░░░░░  47%              │
│                                          │
│  [157 req] [$2.34] [$0.015] [13 days]   │
│                                          │
│  Daily usage chart (bar chart)           │
│  ▁▃▅▂▇▃▅▁▃▂▅▃▁▂▇▃█                     │
│                                          │
│  Breakdown by type:                      │
│  Modify:    102 req  $1.52               │
│  Create:     18 req  $0.54               │
│  Translate:  37 req  $0.28               │
├─────────────────────────────────────────┤
│  📋 Recent AI Calls                     │
│  [table of last 50 calls]               │
└─────────────────────────────────────────┘
```

## 8.2 Responsive design

- Desktop: max-width 600px, centred
- Mobile: full-width with 16px padding
- The daily chart scales horizontally
- The stat cards wrap to 2×2 on narrow screens
- The log table scrolls horizontally if needed

## 8.3 Auto-refresh

The dashboard polls `GET /api/admin/ai` every **30 seconds** while the page is visible (use `document.visibilityState`). Stop polling when hidden to avoid wasted requests.

## 8.4 Component structure

```
src/app/admin/
  page.js              # server component, passes clientId
  AdminPanel.js        # existing, enhanced with dashboard sections
  BudgetCard.js        # budget input + save
  UsageMonitor.js      # gauge + stats + chart + breakdown
  UsageChart.js        # the SVG bar chart
  RequestLog.js        # the table
```

All components are client components (they use state + effects). Keep them as plain React with inline styles or a shared styles object, matching the existing pattern in `AdminPanel.js`.

---

# 9. WIRING: HOW AI STATUS FLOWS THROUGH THE APP

## 9.1 Current flow (preserved)

```
Server: state.js → aiEnabled() → /api/robot checks before every Claude call
Client: BrainRouter.js → checkAiEnabled() → /api/ai-status → skips AI tier when off
```

This is the enforcement layer. **Do not change it.** The nav toggle and visual indicators are a UX layer on top.

## 9.2 New flow (additions)

```
Client: AiStatusProvider (context)
  → fetches /api/ai-status on mount, focus, 60s interval
  → provides { aiEnabled, budgetExhausted } to:
      → AiToggle (nav)
      → Navigation (CSS class .ai-active)
      → RobotChat header (CSS class .ai-active + ✨ badge)
      → RobotBubble (shows 🤖✨ on AI-sourced messages)

Admin page: AdminPanel
  → fetches /api/admin/ai (authenticated, richer data)
  → provides full stats to dashboard components
  → on toggle: POST /api/admin/ai → refetch → AiStatusProvider picks up change within 60s
```

## 9.3 Cross-tab synchronisation

When the admin toggles AI on the admin page, other open tabs should pick up the change. Use `BroadcastChannel('benmaorgal-ai')`:

```js
// Admin page, after successful toggle:
new BroadcastChannel('benmaorgal-ai').postMessage({ enabled: newState })

// AiStatusProvider, on channel message:
channel.onmessage = (e) => { setAiEnabled(e.data.enabled) }
```

Fallback for browsers without `BroadcastChannel`: the 60-second poll catches it.

---

# 10. EXAMPLE PROMPTS & FREE PROMPTS — AI PROCESSING

## 10.1 Current behaviour (no change needed)

The existing `BrainRouter.routePrompt()` already routes **all** prompts through the three tiers when AI is enabled:

1. Phrasebook match → instant, free
2. Local regex match → instant, free
3. Claude API call → 1-3s, metered

Example prompts from `ExamplesModal` call `onSelect(ex.en, ex.he)` → `handleSend` → `routePrompt()`. Free-text prompts from `VoicePrompt` follow the same path. **Both already go through AI when it's on.**

## 10.2 What changes

Nothing changes in the routing logic. The user's requirement is already satisfied by the existing architecture. The **new** parts are:

1. The visible AI toggle (§3) makes it obvious when AI is active
2. The visual indicators (§4) reinforce which mode is active
3. The budget system (§5–6) makes it safe to leave AI on

## 10.3 Verification

After implementation, verify:
- With AI OFF: clicking an example like "תוסיף פצצות" resolves via phrasebook (0ms, $0)
- With AI ON: clicking the same example still resolves via phrasebook (the AI is not called for phrases the phrasebook handles)
- With AI ON: typing a novel prompt like "תעשה שהכוכבים ירקדו" falls through to Claude
- The admin dashboard shows only Claude-tier calls in the cost stats (phrasebook/local are free and don't count)

---

# 11. ENVIRONMENT VARIABLES

**Existing (no change):**

```
ANTHROPIC_API_KEY=sk-ant-...
ROBOT_MODEL=<current Claude Sonnet model id>
TRANSLATE_MODEL=<current Claude Haiku model id>
ADMIN_KEY=<40+ random chars>
KV_REST_API_URL=<from Vercel Marketplace>
KV_REST_API_TOKEN=<from Vercel Marketplace>
AI_DAILY_LIMIT=300
AI_DEVICE_DAILY_LIMIT=100
GOOGLE_CLIENT_ID=<Google OAuth client ID>
ADMIN_EMAIL=<admin's Google email>
TRANSLATE_CONTACT_EMAIL=<email for MyMemory>
```

**New:**

```
# Monthly budget defaults (overridden by admin page setting in KV)
AI_MONTHLY_BUDGET_DEFAULT=5.00
```

This is a fallback only — the admin page writes the actual budget to KV. If both KV and env are absent, the system defaults to $5.00/month.

---

# 12. CONSTRAINTS — READ TWICE

1. **No new npm dependencies.** Charts are SVG. Layout is CSS. No chart library, no dashboard library, no UI component library.
2. **No TypeScript.**
3. **Do not break the existing admin flow.** The secret URL toggle (`/api/ai?key=...`) and the admin page Google Sign-In both keep working.
4. **Do not break `BrainRouter`.** The three-tier routing logic is correct. Do not change the order or the tier selection.
5. **Do not expose budget or usage data publicly.** Only `/api/ai-status` is public, and it shows only `{ enabled, budgetExhausted }`. All detailed stats require admin auth.
6. **KV errors fail safe.** If monthly stats can't be read, skip budget enforcement (the daily cap still protects). If stats can't be written, the response still succeeds.
7. **Monthly stats are best-effort, not transactional.** Redis `INCRBY` in a pipeline is atomic per command but not across commands. A partial pipeline failure means some counters are slightly off. This is acceptable for cost estimation — the admin page says "estimated" everywhere.
8. **Do not touch `public/battle/**`.**
9. **Keep existing daily caps.** The monthly budget is an additional ceiling, not a replacement.
10. **Comments only where they earn their place.** Match existing style.
11. **No fake delays, no loading spinners longer than the actual operation.**

---

# 13. ACCEPTANCE TESTS

## 13.1 Navigation AI Toggle

| # | Do | Expected |
|---|---|---|
| 1 | Load any page with AI OFF | Nav shows grey AI toggle, no glow on nav/chat header |
| 2 | Go to `/admin`, sign in, turn AI ON | Admin page shows ON; nav toggle turns green within 60s (or instantly on same tab) |
| 3 | Open a game workspace in a new tab | Nav toggle is green, nav has animated bottom border, chat header shows ✨ AI badge |
| 4 | On the game page, tap the nav AI toggle (non-admin) | Friendly Hebrew tooltip appears; state does NOT change |
| 5 | Back on admin, turn AI OFF | All tabs revert to grey toggle, no glow, no badge (within 60s or on focus) |

## 13.2 Visual AI Indicators

| # | Do | Expected |
|---|---|---|
| 6 | AI ON, send a phrasebook command ("תוסיף פצצות") | Robot bubble does NOT show 🤖✨ (resolved locally, not AI) |
| 7 | AI ON, send a novel command ("תעשה שהכוכבים ירקדו") | Robot bubble shows 🤖✨ indicator (resolved via Claude) |
| 8 | AI OFF, send the same novel command | Robot says "אני לא מצליח להתחבר" — no AI indicator |
| 9 | Check `prefers-reduced-motion: reduce` | Animated glow replaced with static accent border |

## 13.3 Admin Dashboard — Budget

| # | Do | Expected |
|---|---|---|
| 10 | Sign in to admin, no budget set in KV | Budget shows default $5.00, "≈ 333 requests" (estimated) |
| 11 | Set budget to $2.00, click Save | Budget saved; estimated requests recalculates; gauge updates |
| 12 | Send AI requests until estimated spend exceeds $2.00 | Robot says "הרובוט צריך לנוח עד החודש הבא 😴"; AI toggle shows amber/warning; `/api/ai-status` returns `budgetExhausted: true` |
| 13 | Increase budget to $10.00 on admin page | AI immediately re-enabled; toggle returns to green |
| 14 | Wait for next UTC month (or manually test with a different YYYY-MM) | Counters reset; full budget available again |

## 13.4 Admin Dashboard — Statistics

| # | Do | Expected |
|---|---|---|
| 15 | Send 5 AI requests (mix of modify, create, translate) | Admin dashboard shows: 5 requests, correct token counts, estimated cost, breakdown by type |
| 16 | Check the daily chart | Today's bar shows 5; previous days show their counts or 0 |
| 17 | Check the request log | All 5 calls listed with Hebrew text, English text, mode, tokens, latency, estimated cost |
| 18 | Refresh the admin page | Stats persist (they're in KV, not in-memory). Log may differ (it's per-instance). |
| 19 | After 30 seconds without interaction | Dashboard auto-refreshes with latest data |

## 13.5 Budget Enforcement

| # | Do | Expected |
|---|---|---|
| 20 | Set budget to $0.50, send AI requests | After ~33 requests (at ~$0.015 each), the budget is exhausted |
| 21 | Try another AI request | `robot.tired` message; phrasebook/local still work |
| 22 | Try `/api/translate` with Claude tier | Skips Claude, falls to MyMemory/passthrough |
| 23 | Raise budget to $5.00 | AI resumes immediately |
| 24 | Break `KV_REST_API_TOKEN` | Budget check fails safe; daily cap still enforced; AI works up to daily limit |

## 13.6 Regression

| # | Check |
|---|---|
| 25 | All 12 templates: create, play, restart, modify, reload, delete — with AI on AND off |
| 26 | `/battle` and `/battle/lobby.html` load and play |
| 27 | Secret URL toggle (`/api/ai?key=ADMIN_KEY&on=1/0`) still works |
| 28 | `/api/ai/log?key=ADMIN_KEY` still returns the ring buffer |
| 29 | Mobile: nav toggle visible, admin page scrolls, charts readable |
| 30 | `npm run build` passes with zero errors |
| 31 | No secrets in the client bundle: grep for `ANTHROPIC_API_KEY`, `ADMIN_KEY`, `KV_REST_API_TOKEN`, `GOOGLE_CLIENT_ID` value (the variable name is OK if it's a server-only reference) |
| 32 | With no API key at all: app runs fully on tiers 1–2, admin page shows "KV not configured" |

---

# 14. IMPLEMENTATION ORDER

Execute in this sequence so each step is independently shippable:

| Step | What | Depends on |
|---|---|---|
| **A** | `src/ai/pricing.js` — pricing constants and `estimateCost()` | nothing |
| **B** | Extend `src/ai/state.js` — monthly stat tracking (`bumpMonthlyStats`, `getMonthlyStats`, budget read/write) | A |
| **C** | Wire `bumpMonthlyStats` into `/api/robot` and `/api/translate` — call it after each AI request alongside existing `bumpGlobalCount` | B |
| **D** | Add monthly budget enforcement to `/api/robot` and `/api/translate` | B |
| **E** | Extend `/api/admin/ai` — return budget + monthly stats, accept budget write | B |
| **F** | Extend `/api/ai-status` — add `budgetExhausted` field | B, D |
| **G** | `AiStatusProvider` context + `AiToggle` component | F |
| **H** | Wire `AiToggle` into `Navigation.js` | G |
| **I** | Add `.ai-active` CSS classes to nav and chat header | G, H |
| **J** | Add 🤖✨ indicator to `RobotBubble` for AI-sourced messages | G |
| **K** | Admin page: `BudgetCard.js` | E |
| **L** | Admin page: `UsageMonitor.js` + `UsageChart.js` | E |
| **M** | Admin page: `RequestLog.js` (enhanced with cost estimates) | A, E |
| **N** | Integration testing — all acceptance tests | all |

Steps A–F are backend. Steps G–J are the nav/visual layer. Steps K–M are the admin dashboard. Run the acceptance tests after each group.

---

# 15. FINAL REPORT

When done, produce a concise report covering:

1. What changed, file by file, grouped by: backend (state/pricing/API), navigation/visual, admin dashboard.
2. The complete `/api/admin/ai` response schema as implemented.
3. The complete `/api/ai-status` response schema as implemented.
4. Every new KV key, its format, and its TTL.
5. The pricing constants used and how cost is estimated.
6. The budget enforcement flow: where it's checked, what happens when exhausted, how it recovers.
7. The AI toggle: where it appears, how it reads state, what non-admin users see.
8. The visual indicators: what changes on AI-on, how `prefers-reduced-motion` is handled.
9. The admin dashboard: each section, what data it shows, where the data comes from.
10. The daily chart implementation (SVG details, how many days, hover behaviour).
11. Confirmation that `npm run build` passes.
12. Confirmation that all existing functionality (games, battle, secret URL toggle, daily caps) is preserved.
13. Known limitations and anything deferred.
14. Screenshots or descriptions of: nav with AI on, nav with AI off, admin dashboard with data, admin dashboard empty state.

---

# 16. GUIDING PRINCIPLES

1. **The parent controls the budget.** The child plays. The system enforces.
2. **Cost visibility is for the parent, not the child.** The child never sees dollar amounts, token counts, or budget warnings. They see a friendly robot that sometimes needs to rest.
3. **The AI toggle is a signal, not a gate.** It tells everyone the robot is "powered up" — the actual enforcement is server-side.
4. **Best-effort stats, hard budget cap.** Monthly counters may be slightly off due to Redis pipeline non-atomicity. The budget check is conservative — it pauses AI when the *estimate* reaches the ceiling.
5. **No external dependencies.** Charts are SVG. Layout is CSS flexbox. Auth is the existing Google Sign-In.
6. **Every KV error fails safe.** Missing stats → skip budget check (daily cap still protects). Missing budget → use default ($5). Broken KV → AI stays off.
7. **The existing architecture is correct.** Do not restructure BrainRouter, the three-tier system, the KV flag, or the daily caps. Build on top of them.
