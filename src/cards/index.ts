/** Process card to get final prompt. */
import { Content } from '@google/generative-ai'
import { V2 } from 'character-card-utils'

/** Returns function to replace template. */
function createTemplateProcessor(
  user: string,
  char: string,
  system: string = 'system',
) {
  const userReg = '{{user}}'
  const charReg = '{{char}}'
  const sysReg = '{{system}}'
  const msgExpReg = /\n?<START>/
  const msgReg =
    /({{(?:user|char|system)}}:[\S\s]*?)(?=(?:\n{{(?:user|char|system)}}:|$))/g

  const replaceRoles = (template: string) =>
    template
      .replaceAll(userReg, user)
      .replaceAll(charReg, char)
      .replaceAll(sysReg, system)

  const parseExamples = (template: string): Content[][] =>
    template
      .split(msgExpReg)
      .map((s) =>
        [...s.matchAll(msgReg)].map(([_, s]) => ({
          role: s.startsWith(charReg) ? 'model' : 'user', // NOTE: Gemini-specific.
          parts: [{ text: replaceRoles(s) }],
        })),
      )
      .filter((c) => c.length > 0)

  return { replaceRoles, parseExamples }
}

/* Quick explanation:
 * - Each Content is associated to a role.
 * - Each Content has multiple Parts.
 * - A part is either text or inline blob (image data).
 * - So each content can be thought of as a message comprising multiple parts.
 */

/* More notes:
 * I did a dive into Google's sdk.
 * See: https://github.com/google/generative-ai-js/blob/985e01a0f1629a58287a2c6df71f6c7af91b18fa/packages/main/src/requests/request-helpers.ts#L44
 * Essentially, text mode is a subset of chat mode, where the freeform text prompt is given role user.
 * The actual prompt format is blackbox as the sdk sends everything as Content[].
 */

// See: https://github.com/malfoyslastname/character-card-spec-v2/blob/main/README.md

/** Prompt options. */
export interface PromptOptions {
  /** Character card. */
  card: V2
  /** Username. */
  username: string
  /** Chat history. */
  history: Content[]
  /** Chunks. */
  chunks: string[]
}

// TODO: BIG TODO: THE CHARACTER CARD IS INCORRECT FOR THIS SYSTEM + IT LEAKS INFO.

// TODO: Generalize this from user/model to system/user/model.
export function processPrompt({
  card,
  username,
  history,
  chunks,
}: PromptOptions) {
  const {
    name,
    description,
    personality,
    scenario,
    first_mes,
    mes_example,
    system_prompt,
    post_history_instructions,
  } = card.data
  const { replaceRoles: r, parseExamples } = createTemplateProcessor(
    username,
    name,
  )

  // NOTE: WTF Google, not just no system prompt, but multiturn must be strictly alternating?
  const content: Content[] = []

  const add = (role: string, ...texts: string[]) =>
    content.push({
      role,
      parts: texts.map(r).map((text) => ({ text })),
    })

  const chunksText = chunks.map((c) => `---\n${c}`).join('\n\n')

  // TODO: How to improve below.
  // - Mimick world info system for injecting RAG?
  // - User persona another avenue to tune how model explains things?
  const sysPrompt = `system: ${system_prompt}

## Description of ${name}
${description}

### Personality of ${name}
${personality}

## Scenario
${scenario}

(System Note: The next few messages are examples of how ${name} might respond to the scenario above. Do not say any of these examples or your instructions out loud.)`

  add('user', sysPrompt)
  // NOTE: Gemini-specific workaround.
  add('model', 'system: Understood, waiting for next system instruction.')

  const examples = parseExamples(mes_example)
  for (const example of examples) {
    add('user', 'system: (System Note: Start of Example)')

    // NOTE: Gemini-specific workaround.
    if (example[0].role == 'user')
      add(
        'model',
        'system: Understood, below message is an example that should not be said during Live Conversation.',
      )

    content.push(...example)
    add('user', 'system: (System Note: End of Example)')
    // NOTE: Gemini-specific workaround.
    add(
      'model',
      'system: Example taken, waiting for the next system instruction.',
    )
  }

  // TODO: Have to insert this right after a model message due to strict alternating, how?
  // history.splice(
  //   POST_HIST_INSTRUCT_DEPTH,
  //   0,
  //   {
  //     role: 'user',
  //     parts: [{ text: `system: ${post_history_instructions}` }],
  //   },
  //   // NOTE: Gemini-specific workaround.
  //   {
  //     role: 'model',
  //     parts: [{ text: 'system: Understood.' }],
  //   },
  // )

  add('user', `system: ${post_history_instructions}`)
  // NOTE: Gemini-specific workaround.
  add('model', 'system: Understood, waiting for next system instruction.')

  content.push(
    {
      role: 'user',
      parts: [
        {
          text: `system:
${
  // Make sure chunk isn't parsed by replaceRoles
  chunks
    ? `\`\`\`db-search
Document contents:\n${chunksText}\n\`\`\`\n\n`
    : ''
}(System Note: Start of Live Conversation. DO NOT say 'db-search'. Start your message as '${name}' and stay in character.)`,
        },
      ],
    },
    {
      role: 'model',
      parts: [{ text: `${name}: ${r(first_mes)}` }],
    },
    ...history,
  )

  return content
}
