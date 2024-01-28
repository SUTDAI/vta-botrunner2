import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { geminiPlugin } from './gemini'

// Refer to https://ai.google.dev/tutorials/node_quickstart
// Also check out https://elysiajs.com/validation/overview.html

export const app = new Elysia()
  .use(swagger())
  .group('/api/v1', (app) => app.get('/hello', 'world').use(geminiPlugin))
  .listen(3000)
