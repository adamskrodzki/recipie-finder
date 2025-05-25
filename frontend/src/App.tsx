import { useState } from 'react'
import { IngredientsInput } from './components/IngredientsInput'
import { RecipeList } from './components/RecipeList'
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI-Assisted Recipe Finder</h1>
        <p>Find delicious recipes based on your available ingredients</p>
      </header>
      
      <main>
        <IngredientsInput 
          onSubmit={handleIngredientsSubmit} 
          isLoading={isLoading}
        />

        {error && (
          <div className="error-banner">
            <p>Error: {error}</p>
            <button 
              onClick={() => setError(null)}
              className="error-dismiss"
            >
              Dismiss
            </button>
          </div>
        )}

        <RecipeList 
          recipes={recipes} 
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}

export default App
