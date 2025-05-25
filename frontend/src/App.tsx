import { useState } from 'react'
import { IngredientsInput } from './components/organisms/IngredientsInput'
import { RecipeList } from './components/organisms/RecipeList'
import type { Recipe } from './types/Recipe'
import './App.css'

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleIngredientsSubmit = async (ingredients: string[]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:4000/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recipes')
      }

      const data = await response.json()
      setRecipes(data.recipes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefine = (recipeId: string) => {
    console.log('Refine recipe:', recipeId)
    // TODO: Implement recipe refinement
  }

  const handleFavorite = (recipeId: string) => {
    console.log('Toggle favorite:', recipeId)
    // TODO: Implement favorite toggle
  }

  const handleRatingChange = (recipeId: string, rating: number) => {
    console.log('Rate recipe:', recipeId, rating)
    // TODO: Implement rating change
  }

  return (
    <div className="app">
      <div className="app__background">
        <header className="app__header">
          <h1 className="app__title">AI-Assisted Recipe Finder</h1>
          <p className="app__subtitle">Find delicious recipes based on your available ingredients</p>
        </header>
        
        <main className="app__main">
          <IngredientsInput 
            onSubmit={handleIngredientsSubmit} 
            isLoading={isLoading}
          />

          {error && (
            <div className="app__error">
              <p>Error: {error}</p>
              <button 
                onClick={() => setError(null)}
                className="app__error-dismiss"
              >
                Dismiss
              </button>
            </div>
          )}

          <RecipeList 
            recipes={recipes} 
            isLoading={isLoading}
            onRefine={handleRefine}
            onFavorite={handleFavorite}
            onRatingChange={handleRatingChange}
          />
        </main>
      </div>
    </div>
  )
}

export default App
