import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { geminiPlugin } from './gemini'

export const app = new Elysia()
  .use(swagger())
  .group('/api/v1', (app) => app.get('/hello', 'world').use(geminiPlugin))
  .listen(3000)
