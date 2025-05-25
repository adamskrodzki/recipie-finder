import { useState } from 'react'
import './App.css'

function App() {
  const [ingredients, setIngredients] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recipes, setRecipes] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement recipe search functionality
    console.log('Searching for recipes with ingredients:', ingredients)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI-Assisted Recipe Finder</h1>
        <p>Find delicious recipes based on your available ingredients</p>
      </header>
      
      <main>
        <form onSubmit={handleSubmit} className="ingredient-form">
          <div className="form-group">
            <label htmlFor="ingredients">
              Enter your available ingredients (comma-separated):
            </label>
            <input
              type="text"
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g., chicken, rice, tomatoes"
              className="ingredient-input"
            />
          </div>
          <button type="submit" className="search-button">
            Find Recipes
          </button>
        </form>

        {recipes.length > 0 && (
          <div className="recipes-section">
            <h2>Suggested Recipes</h2>
            <ul className="recipes-list">
              {recipes.map((recipe, index) => (
                <li key={index}>{recipe}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
