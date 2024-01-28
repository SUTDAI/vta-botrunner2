/** Process card to get final prompt. */
import { Content } from '@google/generative-ai'
import { V2 } from 'character-card-utils'

/** Returns function to replace template. */
function createTemplateProcessor(user: string, char: string) {
  const userReg = '{{user}}'
  const charReg = '{{char}}'
  const msgExpReg = /\n?<START>/
  const msgReg = /({{(?:user|char)}}:[\S\s]*?)(?=(?:\n{{(?:user|char)}}:|$))/g

  const replaceRoles = (template: string) =>
    template.replaceAll(userReg, user).replaceAll(charReg, char)

  const parseExamples = (template: string): Content[][] =>
    template
      .split(msgExpReg)
      .map((s) =>
        [...s.matchAll(msgReg)].map(([_, s]) => ({
          role: s.startsWith(userReg) ? 'user' : 'model', // NOTE: Gemini-specific.
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
}

// TODO: Generalize this from user/model to system/user/model.
export function processPrompt({ card, username, history }: PromptOptions) {
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

  // TODO: How to improve below.
  // - Mimick world info system for injecting RAG?
  // - User persona another avenue to tune how model explains things?
  const sysPrompt = `system:
# Conversation Context
${r(system_prompt)}

## Description of ${name}
${r(description)}

### Personality of ${name}
${r(personality)}

## Scenario
${r(scenario)}

(System Note: The next few messages are examples of how ${name} might respond to the scenario above.)`

  content.push(
    {
      role: 'user',
      parts: [{ text: sysPrompt }],
    },
    // NOTE: Gemini-specific workaround.
    {
      role: 'model',
      parts: [
        {
          text: 'system: Certainly! I will follow your instructions faithfully.',
        },
      ],
    },
  )

  const examples = parseExamples(mes_example)
  for (const example of examples) {
    content.push({
      role: 'user',
      parts: [{ text: 'system: (System Note: Start of Example)' }],
    })

    // NOTE: Gemini-specific workaround.
    if (example[0].role == 'user')
      content.push({
        role: 'model',
        parts: [{ text: first_mes }],
      })

    content.push(
      ...example,
      {
        role: 'user',
        parts: [{ text: 'system: (System Note: End of Example)' }],
      },
      // NOTE: Gemini-specific workaround.
      {
        role: 'model',
        parts: [
          { text: 'system: Example taken, waiting for the next instruction.' },
        ],
      },
    )
  }

  content.push(
    {
      role: 'user',
      parts: [{ text: `system: ${post_history_instructions}` }],
    },
    // NOTE: Gemini-specific workaround.
    {
      role: 'model',
      parts: [{ text: 'system: Understood.' }],
    },
    {
      role: 'user',
      parts: [{ text: 'system: (System Note: Start of Live Conversation)' }],
    },
    {
      role: 'model',
      parts: [{ text: `${name}: ${first_mes}` }],
    },
    ...history,
  )

  return content
}