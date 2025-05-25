/* global fetch */
import { useState } from 'react';
import IngredientsInput from './IngredientsInput';
import RecipeList, { type Recipe } from './RecipeList';
import './App.css';

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindRecipes = async (ingredients: string[]) => {
    setLoading(true);
    setError(null);
    setRecipes([]);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch recipes');
      }
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || 'Unknown error');
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>AI-Assisted Recipe Finder</h1>
      <IngredientsInput onSubmit={handleFindRecipes} />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <RecipeList recipes={recipes} />
    </div>
  );
}

export default App;
