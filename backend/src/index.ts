import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { OpenRouterService } from './openrouter'
import { RecipeRequest, RecipeRefinementRequest } from './types'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

// Initialize OpenRouter service
const openRouterApiKey = process.env.OPENROUTER_API_KEY
if (!openRouterApiKey) {
  console.error('OPENROUTER_API_KEY environment variable is required')
  process.exit(1)
}
const openRouterService = new OpenRouterService(openRouterApiKey)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Recipe generation endpoint using OpenRouter LLM
app.post('/api/recipes', async (req, res) => {
  try {
    const { ingredients }: RecipeRequest = req.body
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients array is required' })
    }

    // Validate ingredients are non-empty strings
    const validIngredients = ingredients.filter(ingredient => 
      typeof ingredient === 'string' && ingredient.trim().length > 0
    )

    if (validIngredients.length === 0) {
      return res.status(400).json({ error: 'At least one valid ingredient is required' })
    }

    // Generate recipes using OpenRouter LLM
    const recipes = await openRouterService.generateRecipes(validIngredients)
    
    res.json({ recipes })
  } catch (error) {
    console.error('Error generating recipes:', error)
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipes'
    res.status(500).json({ error: errorMessage })
  }
})

// Recipe refinement endpoint using OpenRouter LLM
app.post('/api/recipes/refine', async (req, res) => {
  try {
    const { recipe, instruction }: RecipeRefinementRequest = req.body
    
    if (!recipe || typeof recipe !== 'object') {
      return res.status(400).json({ error: 'Recipe object is required' })
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return res.status(400).json({ error: 'Refinement instruction is required' })
    }

    // Validate recipe structure
    if (!recipe.id || !recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      return res.status(400).json({ error: 'Invalid recipe structure' })
    }

    if (recipe.ingredients.length === 0 || recipe.steps.length === 0) {
      return res.status(400).json({ error: 'Recipe must have ingredients and steps' })
    }

    // Refine recipe using OpenRouter LLM
    const refinedRecipe = await openRouterService.refineRecipe(recipe, instruction.trim())
    
    res.json({ refinedRecipe })
  } catch (error) {
    console.error('Error refining recipe:', error)
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to refine recipe'
    res.status(500).json({ error: errorMessage })
  }
})

// Debug endpoint for testing OpenRouter integration
app.post('/api/debug/recipes', async (req, res) => {
  try {
    const { ingredients }: RecipeRequest = req.body
    const startTime = Date.now()
    
    console.log('=== DEBUG RECIPE GENERATION START ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Input ingredients:', ingredients)
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      const error = 'Ingredients array is required'
      console.log('Validation error:', error)
      return res.status(400).json({ 
        error,
        debug: {
          timestamp: new Date().toISOString(),
          input: ingredients,
          validationFailed: true
        }
      })
    }

    // Validate ingredients are non-empty strings
    const validIngredients = ingredients.filter(ingredient => 
      typeof ingredient === 'string' && ingredient.trim().length > 0
    )
    
    console.log('Valid ingredients after filtering:', validIngredients)

    if (validIngredients.length === 0) {
      const error = 'At least one valid ingredient is required'
      console.log('Validation error:', error)
      return res.status(400).json({ 
        error,
        debug: {
          timestamp: new Date().toISOString(),
          input: ingredients,
          filteredIngredients: validIngredients,
          validationFailed: true
        }
      })
    }

    // Generate recipes using OpenRouter LLM with detailed logging
    console.log('Calling OpenRouter service...')
    const recipes = await openRouterService.generateRecipes(validIngredients)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('Recipe generation successful!')
    console.log('Duration:', duration, 'ms')
    console.log('Generated recipes count:', recipes.length)
    console.log('Recipe titles:', recipes.map(r => r.title))
    console.log('=== DEBUG RECIPE GENERATION END ===')
    
    res.json({ 
      recipes,
      debug: {
        timestamp: new Date().toISOString(),
        input: ingredients,
        filteredIngredients: validIngredients,
        duration: duration,
        recipesCount: recipes.length,
        success: true
      }
    })
  } catch (error) {
    const endTime = Date.now()
    const startTime = endTime - (req.body.startTime || 0)
    
    console.error('=== DEBUG RECIPE GENERATION ERROR ===')
    console.error('Timestamp:', new Date().toISOString())
    console.error('Error details:', error)
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    console.error('Input ingredients:', req.body.ingredients)
    console.error('=== DEBUG RECIPE GENERATION ERROR END ===')
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipes'
    res.status(500).json({ 
      error: errorMessage,
      debug: {
        timestamp: new Date().toISOString(),
        input: req.body.ingredients,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        success: false
      }
    })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
