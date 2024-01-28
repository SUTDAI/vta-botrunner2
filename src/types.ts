import { t } from 'elysia'

declare module 'bun' {
  interface Env {
    /** Google AI Studio API key (used for Gemini). */
    GOOGLEAI_KEY: string
  }
}

export const GenReqType = t.Object({
  prompt: t.String(),
  customCard: t.Optional(t.File()),
})
export const GenResType = t.Object({ text: t.String() })
