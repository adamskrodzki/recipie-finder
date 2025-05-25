import { useState } from 'react'
import { IngredientsInput } from './components/organisms/IngredientsInput'
import { RecipeList } from './components/organisms/RecipeList'
import { RecipeRefinementModal } from './components/organisms/RecipeRefinementModal'
import type { Recipe } from './types/Recipe'
import './App.css'

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refinementModal, setRefinementModal] = useState<{
    isOpen: boolean;
    recipe: Recipe | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    recipe: null,
    isLoading: false
  })

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
    const recipe = recipes.find(r => r.id === recipeId)
    if (recipe) {
      setRefinementModal({
        isOpen: true,
        recipe,
        isLoading: false
      })
    }
  }

  const handleRefinementSubmit = async (recipe: Recipe, instruction: string) => {
    setRefinementModal(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await fetch('http://localhost:4000/api/recipes/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe, instruction }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refine recipe')
      }

      const data = await response.json()
      
      // Update the recipe in the list
      setRecipes(prevRecipes => 
        prevRecipes.map(r => 
          r.id === recipe.id ? { ...data.refinedRecipe, rating: r.rating, isFavorite: r.isFavorite } : r
        )
      )
    } finally {
      setRefinementModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleRefinementModalClose = () => {
    setRefinementModal({
      isOpen: false,
      recipe: null,
      isLoading: false
    })
  }

  const handleFavorite = (recipeId: string) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      )
    )
  }

  const handleRatingChange = (recipeId: string, rating: number) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, rating }
          : recipe
      )
    )
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
            hasRecipes={recipes.length > 0}
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

      <RecipeRefinementModal
        isOpen={refinementModal.isOpen}
        onClose={handleRefinementModalClose}
        recipe={refinementModal.recipe}
        onRefine={handleRefinementSubmit}
        isLoading={refinementModal.isLoading}
      />
    </div>
  )
}

export default App
