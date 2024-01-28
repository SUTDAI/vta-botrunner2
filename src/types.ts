import { t } from 'elysia'

declare module 'bun' {
  interface Env {
    /** Google AI Studio API key (used for Gemini). */
    GOOGLEAI_KEY: string
  }
}

// https://elysiajs.com/validation/overview.html
export const GenReqType = t.Object({
  prompt: t.String(),
  customCard: t.Optional(t.String()),
})
export const GenResType = t.Object({ text: t.String() })
