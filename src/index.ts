import {
  GenerationConfig,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  SafetySetting,
} from '@google/generative-ai'
import { Elysia, t } from 'elysia'

// Refer to https://ai.google.dev/tutorials/node_quickstart
// Also check out https://elysiajs.com/validation/overview.html

const MODEL_NAME = 'gemini-pro'
const API_KEY = process.env.GOOGLEAI_KEY

const safetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
]

const generationConfig: GenerationConfig = {
  candidateCount: 1,
  temperature: 0.9,
  topP: 1,
  topK: 1,
}

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  safetySettings,
  generationConfig,
})

const app = new Elysia()

app.post(
  '/generate',
  async ({ body }) => {
    const { prompt } = body
    const { response } = await model.generateContent(prompt)

    return {
      text: response.text(),
    }
  },
  { body: t.Object({ prompt: t.String() }) },
)

app.listen(3000)
