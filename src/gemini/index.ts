/** Use Gemini as generation source. */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseToV2 } from 'character-card-utils'
import { Elysia } from 'elysia'
import { processPrompt } from '../cards'
import { GenReqType, GenResType, Msg } from '../types'
import { API_KEY, MODEL_NAME, generationConfig, safetySettings } from './config'

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  safetySettings,
  generationConfig,
})

const defaultCard = Bun.file('src/cards/VirtuTA-v0.2.2-specV2.json')
/** For debug purposes only. */
const allowCustomCards = process.env.NODE_ENV == 'development'

export const geminiPlugin = (app: Elysia) => {
  return app.post(
    '/generate',
    async ({ body }) => {
      const { prompt, chat, customCard, chunks, autoSearch, datasetId } = body
      if ((!prompt && !chat) || (prompt && chat))
        throw new TypeError('Only prompt or chat must be provided.')

      let history: Msg[] = (chat as Msg[]) ?? [{ role: 'user', text: prompt }]

      let card = parseToV2(await defaultCard.json())
      if (allowCustomCards && customCard) {
        console.warn(
          `In ${process.env.NODE_ENV} (should be development) mode, custom card allowed!`,
        )
        try {
          card = parseToV2(JSON.parse(customCard))
        } catch (e) {
          console.error(e)
          throw new SyntaxError('customCard is not valid.')
        }
        console.log('Card used:')
        console.log(card)
      }

      let defaultChunks: string[] = []
      if (autoSearch) {
        const resp = await fetch(process.env.RAG_EP, {
          method: 'POST',
          body: JSON.stringify({
            ds_id: datasetId ?? '00000000-0000-0000-0000-000000000000',
            query: history[history.length - 1].text ?? '',
          }),
        })
        const result: any = await resp.json()
        defaultChunks = (result.chunks ?? [])
          .map(([s, t]: [number, string]) => t ?? false)
          .filter(Boolean)
        // console.log(
        //   `Query: "${prompt}"\n\nChunks (${defaultChunks.length}):\n${defaultChunks.join('\n\n')}`,
        // )
      }

      defaultChunks = chunks ?? defaultChunks
      const content = processPrompt({
        card,
        username: 'user',
        history,
        chunks: defaultChunks,
      })
      console.log(content.map((c) => c.parts[0].text).join('\n\n'))

      const { response } = await model.generateContent({ contents: content })

      return {
        text: response.text().replace(`${card.data.name}: `, ''),
        chunks: defaultChunks,
      }
    },
    { body: GenReqType, response: GenResType },
  )
}
