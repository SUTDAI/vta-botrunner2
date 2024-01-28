/** Use Gemini as generation source. */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseToV2 } from 'character-card-utils'
import { Elysia } from 'elysia'
import { GenReqType, GenResType } from '../types'
import { API_KEY, MODEL_NAME, generationConfig, safetySettings } from './config'

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  safetySettings,
  generationConfig,
})

const defaultCardFile = Bun.file('src/cards/VirtuTA-v0.2.2-specV2.json')

export const geminiPlugin = (app: Elysia) => {
  return app.post(
    '/generate',
    async ({ body }) => {
      const { prompt, customCard } = body
      const { response } = await model.generateContent(prompt)

      const card = parseToV2(await (customCard ?? defaultCardFile).json())
      console.log(card)

      return { text: response.text() }
    },
    { body: GenReqType, response: GenResType },
  )
}
