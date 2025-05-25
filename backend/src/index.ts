import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(4000, () => {
    console.log('Backend listening on http://localhost:4000')
  })
}

export default app;
