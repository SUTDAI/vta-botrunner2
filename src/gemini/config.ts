/** Config options for using Gemini as generation source. */
import {
  GenerationConfig,
  HarmBlockThreshold,
  HarmCategory,
  SafetySetting,
} from '@google/generative-ai'

export const MODEL_NAME = 'gemini-pro'
export const API_KEY = process.env.GOOGLEAI_KEY

export const safetySettings: SafetySetting[] = [
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

export const generationConfig: GenerationConfig = {
  candidateCount: 1,
  temperature: 0.9,
  topP: 1,
  topK: 1,
}

/** Depth at which to insert `post_history_instructions`. */
export const POST_HIST_INSTRUCT_DEPTH = -2
