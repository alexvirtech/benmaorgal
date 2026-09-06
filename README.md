# BenMaorgal — AI Game-Making Robot MVP

A child-friendly browser game creation environment where kids aged 8-15 can create and modify games by chatting with a friendly robot.

## Architecture

```
Child prompt → Game Interpreter → GameDefinition → Game SDK → Template → Playable Game
```

- **Game Robot**: Friendly chat interface where kids describe what they want
- **Game Interpreter**: Local pattern-matching system (replaceable with AI later)
- **GameDefinition**: Serializable JSON describing a game's configuration
- **GameAction**: Structured modifications applied to GameDefinitions
- **Game SDK**: Shared engine with entities, physics, input, rendering
- **Templates**: 10 pre-built game families sharing SDK primitives
- **Persistence**: localStorage via clean repository abstraction

## Routes

| Route | Description |
|-------|-------------|
| `/` | Game Robot landing page |
| `/games` | My Games — saved games list |
| `/games/[id]` | Game workspace (chat + live game) |
| `/battle` | Existing Ben's Brawl Apps |

Legacy redirect: `/game` → `/battle`

## Game Templates

| # | Template | Icon | Example |
|---|----------|------|---------|
| 1 | Catch | ⭐ | Cat catches falling stars |
| 2 | Dodge | 💣 | Avoid falling bombs |
| 3 | Jumper | 🐸 | Frog jumps over monsters |
| 4 | Shooter | 🚀 | Spaceship shoots aliens |
| 5 | Pong | 🏓 | Classic paddle & ball |
| 6 | Breakout | 🧱 | Break all bricks |
| 7 | Snake | 🐍 | Eat food and grow |
| 8 | Memory | 🧠 | Match card pairs |
| 9 | Clicker | 🎯 | Click target before it disappears |
| 10 | Racer | 🏎️ | Dodge traffic on the road |

## Supported Prompt Commands

### Creating games
- "Make a game where a cat catches stars" → Catch
- "Make a game where I avoid bombs" → Dodge
- "Make a frog jump over monsters" → Jumper
- "Make a spaceship shoot aliens" → Shooter
- "Make Pong" → Pong
- "Make a game where I break bricks" → Breakout
- "Make a snake that eats apples" → Snake
- "Make a matching cards game" → Memory
- "Make a game where I click the monster" → Clicker
- "Make a car racing game" → Racer

### Modifying games
- "Make me faster" / "Make it slower"
- "Add bombs" / "Remove bombs"
- "Give me 5 lives" / "Add a life"
- "Make it harder" / "Make it easier"
- "Make the background space/forest/night/..."
- "Change the player to dog/robot/..."
- "Make the player bigger/smaller"
- "Set target score to 50"

### Undo
Click ↩ Undo to revert the last change.

## Adding a New Template (Game #11)

1. Create `src/game-templates/mytemplate.js`:
   ```js
   export const mytemplateTemplate = {
     id: 'mytemplate',
     name: 'My Template',
     icon: '🎮',
     description: '...',
     examplePrompt: '...',
     suggestions: [...],
     getDefaultDefinition() { return { template: 'mytemplate', ... } },
     setup(engine, def) { /* create entities */ },
     update(engine, dt) { /* game logic each frame */ },
     render(engine, ctx) { /* draw everything */ },
   }
   ```

2. Register in `src/game-templates/index.js`:
   ```js
   import { mytemplateTemplate } from './mytemplate.js'
   // Add to templates object
   ```

3. Add keywords in `src/game-interpreter/promptPatterns.js`:
   ```js
   { template: 'mytemplate', keywords: ['keyword1', 'keyword2'], icon: '🎮' }
   ```

4. Add to `src/game-data/schema.js` TEMPLATES array.

## Adding a New Action

1. Add the action type in `src/game-data/actions.js` ACTION_TYPES array.
2. Add a case in `applyGameAction()` switch.
3. Add a pattern in `src/game-interpreter/promptPatterns.js` MODIFICATION_PATTERNS.

## Future AI Integration

Replace `LocalGameInterpreter` with an AI-powered interpreter:

1. Create `src/game-interpreter/AIGameInterpreter.js`
2. Implement `interpretPrompt(prompt, currentGame)` using the AI API
3. The AI receives context: `{ prompt, currentGameDefinition, supportedTemplates, supportedActions, allowedAssets }`
4. Returns structured output: `{ intent, actions, response }` — validated before execution
5. Swap the import in the workspace page

## Running Locally

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
npm start         # Production server
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages
  components/             # React components (robot, games, layout)
  game-sdk/               # Shared game engine
  game-templates/         # 10 game template implementations
  game-interpreter/       # Local prompt interpreter
  game-data/              # Schema, validation, actions
  repositories/           # localStorage persistence

public/
  battle/                 # Legacy Ben's Brawl Apps (static HTML)
```
