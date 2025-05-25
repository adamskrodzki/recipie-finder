import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Stub endpoint for recipe generation
app.post('/api/recipes', (req, res) => {
  const { ingredients } = req.body
  
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Ingredients array is required' })
  }

  // Generate 3 stub recipes based on ingredients
  const recipes = [
    {
      id: '1',
      title: `${ingredients[0]} Stir Fry`,
      ingredients: [...ingredients, 'soy sauce', 'garlic', 'ginger', 'oil'],
      steps: [
        'Heat oil in a large pan or wok over medium-high heat',
        'Add garlic and ginger, stir for 30 seconds until fragrant',
        `Add ${ingredients[0]} and cook for 3-4 minutes`,
        'Add remaining ingredients and stir fry for 2-3 minutes',
        'Season with soy sauce and serve hot'
      ]
    },
    {
      id: '2',
      title: `Creamy ${ingredients[0]} Soup`,
      ingredients: [...ingredients, 'onion', 'garlic', 'cream', 'vegetable broth', 'herbs'],
      steps: [
        'Sauté onion and garlic in a large pot until softened',
        `Add ${ingredients[0]} and cook for 5 minutes`,
        'Pour in vegetable broth and bring to a boil',
        'Simmer for 15-20 minutes until tender',
        'Blend until smooth, stir in cream and herbs',
        'Season to taste and serve warm'
      ]
    },
    {
      id: '3',
      title: `Baked ${ingredients[0]} Casserole`,
      ingredients: [...ingredients, 'cheese', 'breadcrumbs', 'butter', 'milk', 'seasonings'],
      steps: [
        'Preheat oven to 375°F (190°C)',
        `Layer ${ingredients[0]} in a greased baking dish`,
        'Mix milk with seasonings and pour over ingredients',
        'Top with cheese and breadcrumbs',
        'Dot with butter and bake for 25-30 minutes',
        'Let cool for 5 minutes before serving'
      ]
    }
  ]

  res.json({ recipes })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
