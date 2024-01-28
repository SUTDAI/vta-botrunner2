/** Use Gemini as generation source. */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Elysia } from 'elysia'
import { GenReqType, GenResType } from '../types'
import { API_KEY, MODEL_NAME, generationConfig, safetySettings } from './config'

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  safetySettings,
  generationConfig,
})

export const geminiPlugin = (app: Elysia) => {
  return app.post(
    '/generate',
    async ({ body }) => {
      const { prompt } = body
      const { response } = await model.generateContent(prompt)

      return { text: response.text() }
    },
    { body: GenReqType, response: GenResType },
  )
}
