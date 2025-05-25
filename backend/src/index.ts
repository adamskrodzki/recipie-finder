import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Recipe } from './types.js';

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/recipes', (req, res) => {
  const { ingredients } = req.body;
  if (!Array.isArray(ingredients)) {
    res.status(400).json({ error: 'ingredients must be an array of strings' });
    return;
  }
  const recipes: Recipe[] = [
    {
      title: 'Simple Veggie Stir Fry',
      ingredients: ['broccoli', 'carrot', 'soy sauce', 'garlic'],
      steps: [
        'Chop all vegetables.',
        'Heat oil in a pan and add garlic.',
        'Add vegetables and stir fry for 5-7 minutes.',
        'Add soy sauce and cook for another 2 minutes.'
      ]
    },
    {
      title: 'Pasta Primavera',
      ingredients: ['pasta', 'bell pepper', 'zucchini', 'olive oil', 'parmesan'],
      steps: [
        'Cook pasta according to package instructions.',
        'Sauté bell pepper and zucchini in olive oil.',
        'Combine cooked pasta with vegetables.',
        'Top with parmesan and serve.'
      ]
    }
  ];
  res.status(200).json({ recipes });
})

// Only start the server if this file is run directly
// (moved to server.ts for testability)

export default app;
