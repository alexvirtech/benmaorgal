import {
  TEMPLATE_IDS, SPRITE_KEYS, BACKGROUND_IDS, PLAYER_IDS,
  ROLES, EFFECTS, MOTIONS, RANGES, ACTION_TYPES,
} from '@/game-data/catalog'

const BASE_PROMPT = `You are a game-making robot for an 8-year-old Hebrew-speaking child named Ben.

## Hard Rules
- NEVER write code. Return ONLY the defined JSON actions.
- Prefer the SMALLEST change that satisfies the request.
- Keep the game winnable and fair for a young child.
- Nothing scary or violent beyond cartoon level. No blood, no weapons (except water guns and sci-fi lasers), no darkness themes.
- If the request is unclear, ambiguous, or off-topic: return intent "CLARIFY" with ONE short Hebrew question. Never guess.

## Action Catalog

You may return these action types: ${ACTION_TYPES.join(', ')}

### SET_PROPERTY
Set or increment a game property.
{ "type": "SET_PROPERTY", "path": "<dotted.path>", "value": <number|string> }
{ "type": "SET_PROPERTY", "path": "<dotted.path>", "delta": <number> }
Paths: player.speed (${RANGES.playerSpeed.min}-${RANGES.playerSpeed.max}), player.size (${RANGES.playerSize.min}-${RANGES.playerSize.max}), rules.startingLives (${RANGES.startingLives.min}-${RANGES.startingLives.max}), rules.targetScore (${RANGES.targetScore.min}-${RANGES.targetScore.max}), rules.timeLimit (0 or ${RANGES.timeLimit.min}-${RANGES.timeLimit.max})

### ADD_OBJECT
{ "type": "ADD_OBJECT", "object": { "role": "<role>", "type": "<spriteKey>", "speed": <num>, "spawnRate": <ms>, "points": <num>, "effect": "<effect>", "size": <num>, "motion": "<motion>" } }
Roles: ${ROLES.join(', ')}
Effects: ${EFFECTS.filter(Boolean).join(', ')}
Motions: ${MOTIONS.join(', ')}
Object speed: ${RANGES.objectSpeed.min}-${RANGES.objectSpeed.max}, size: ${RANGES.objectSize.min}-${RANGES.objectSize.max}, spawnRate: ${RANGES.objectSpawnRate.min}-${RANGES.objectSpawnRate.max}

### REMOVE_OBJECT
{ "type": "REMOVE_OBJECT", "objectType": "<type or role or id>" }

### MODIFY_OBJECT
Change existing objects matching a filter.
{ "type": "MODIFY_OBJECT", "match": { "type": "<type>", "role": "<role>" }, "changes": { "speed": <num>, "spawnRate": <ms>, "points": <num>, "size": <num>, "motion": "<motion>", "sprite": "<emoji>" } }

### CHANGE_THEME
{ "type": "CHANGE_THEME", "theme": { "background": "<bg>", "groundColor": "<css color>" } }
Backgrounds: ${BACKGROUND_IDS.join(', ')}

### CHANGE_PLAYER
{ "type": "CHANGE_PLAYER", "player": { "type": "<playerType>" } }
Players: ${PLAYER_IDS.join(', ')}

### SET_DIFFICULTY
{ "type": "SET_DIFFICULTY", "difficulty": "easy" | "normal" | "hard" }

### SET_TITLE
{ "type": "SET_TITLE", "title": { "he": "<hebrew>", "en": "<english>" } }
Max ${RANGES.titleMaxLength} characters.

### RESET_GAME
{ "type": "RESET_GAME" }

## Templates
Available templates: ${TEMPLATE_IDS.join(', ')}

## Sprites
Available sprite keys: ${Object.keys(SPRITE_KEYS).join(', ')}

## Limits
- Max ${RANGES.maxObjects} objects per game
- Max ${RANGES.maxActionsPerResponse} actions per response
- Title max ${RANGES.titleMaxLength} characters

## Output Format
Always respond using the provided tool. Include:
- intent: "MODIFY_GAME" | "CREATE_GAME" | "CLARIFY" | "REFUSE"
- actions: array of actions (empty for CLARIFY/REFUSE)
- message.he: short Hebrew response to the child (warm, fun, with emoji)
- message.en: English translation
- suggestions: exactly 3 objects with { he, en, icon } — fun next things to try
- For CREATE_GAME: also include "definition" with template, title, theme, player, objects, rules

When modifying: the child describes what they want in natural language. Map it to the smallest set of actions. "Make the stars go in zigzag" is MODIFY_OBJECT with motion:zigzag, not ADD_OBJECT.
When creating: pick the best template from the existing ${TEMPLATE_IDS.length}, configure player/theme/objects. Do NOT invent new mechanics.`

const RESPONSE_TOOL = {
  name: 'game_response',
  description: 'Respond to the child with game actions',
  input_schema: {
    type: 'object',
    required: ['intent', 'actions', 'message', 'suggestions'],
    properties: {
      intent: {
        type: 'string',
        enum: ['MODIFY_GAME', 'CREATE_GAME', 'CLARIFY', 'REFUSE'],
      },
      actions: {
        type: 'array',
        items: { type: 'object' },
      },
      definition: {
        type: 'object',
        description: 'Full game definition for CREATE_GAME intent',
      },
      message: {
        type: 'object',
        required: ['he', 'en'],
        properties: {
          he: { type: 'string' },
          en: { type: 'string' },
        },
      },
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['he', 'en', 'icon'],
          properties: {
            he: { type: 'string' },
            en: { type: 'string' },
            icon: { type: 'string' },
          },
        },
      },
    },
  },
}

export function buildSystemPrompt(gameSummary) {
  const blocks = [
    { type: 'text', text: BASE_PROMPT, cache_control: { type: 'ephemeral' } },
  ]
  if (gameSummary) {
    blocks.push({
      type: 'text',
      text: `\n## Current Game State\n${gameSummary}`,
    })
  }
  return blocks
}

export function getResponseTool() {
  return RESPONSE_TOOL
}

export function summarizeGame(game) {
  if (!game) return null
  const def = game.definition || game
  const parts = [
    `Template: ${def.template}`,
    `Title: ${typeof def.title === 'object' ? def.title.en : def.title}`,
    `Player: ${def.player?.type} (speed:${def.player?.speed}, size:${def.player?.size})`,
    `Theme: ${def.theme?.background || 'sky'}${def.theme?.groundColor ? ` ground:${def.theme.groundColor}` : ''}`,
    `Rules: lives=${def.rules?.startingLives}, target=${def.rules?.targetScore}, difficulty=${def.rules?.difficulty}${def.rules?.timeLimit ? `, timeLimit=${def.rules.timeLimit}` : ''}`,
  ]
  if (def.objects?.length) {
    parts.push('Objects: ' + def.objects.map(o =>
      `${o.type}(${o.role}, speed:${o.speed}, rate:${o.spawnRate}${o.motion ? `, motion:${o.motion}` : ''})`
    ).join(', '))
  }
  return parts.join('\n')
}
