import { useState } from 'react';
import './IngredientsInput.css';

interface IngredientsInputProps {
  onSubmit: (ingredients: string[]) => void;
  isLoading?: boolean;
}

export const IngredientsInput: React.FC<IngredientsInputProps> = ({ 
  onSubmit, 
  isLoading = false 
}) => {
  const [ingredients, setIngredients] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ingredients.trim()) {
      return;
    }

    // Parse comma-separated ingredients and clean them up
    const ingredientList = ingredients
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);

    if (ingredientList.length > 0) {
      onSubmit(ingredientList);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ingredients-input">
      <div className="form-group">
        <label htmlFor="ingredients" className="form-label">
          Enter your available ingredients (comma-separated):
        </label>
        <input
          type="text"
          id="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="e.g., chicken, rice, tomatoes, onions"
          className="ingredient-input"
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="search-button"
        disabled={isLoading || !ingredients.trim()}
      >
        {isLoading ? 'Finding Recipes...' : 'Find Recipes'}
      </button>
    </form>
  );
}; 