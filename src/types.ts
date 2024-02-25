import { t } from 'elysia'

declare module 'bun' {
  interface Env {
    /** Google AI Studio API key (used for Gemini). */
    GOOGLEAI_KEY: string
    /** Chunk query endpoint. */
    RAG_EP: string
  }
}

export interface Msg {
  role: 'user' | 'model'
  text: string
}

// https://elysiajs.com/validation/overview.html
export const GenReqType = t.Object({
  prompt: t.Optional(t.String()),
  chat: t.Optional(t.Array(t.Object({ role: t.String(), text: t.String() }))),
  customCard: t.Optional(t.String()),
  chunks: t.Optional(t.Array(t.String())),
  autoSearch: t.Optional(t.Boolean()),
  datasetId: t.Optional(t.String()),
})
export const GenResType = t.Object({
  text: t.String(),
  chunks: t.Optional(t.Array(t.String())),
})
