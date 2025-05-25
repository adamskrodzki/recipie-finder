import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getRecipes } from './routes/recipes'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/recipes', getRecipes)

app.listen(4000, () => {
  console.log('Backend listening on http://localhost:4000')
})
