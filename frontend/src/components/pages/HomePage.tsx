import { useState } from 'react';
import { IngredientsInput } from '../organisms/IngredientsInput';
import { RecipeList } from '../organisms/RecipeList';
import { RecipeRefinementModal } from '../organisms/RecipeRefinementModal';
import { useRecipeStorage } from '../../hooks/useRecipeStorage';
import type { Recipe } from '../../types/Recipe';

export const HomePage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinementModal, setRefinementModal] = useState<{
    isOpen: boolean;
    recipe: Recipe | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    recipe: null,
    isLoading: false
  });

  const { 
    toggleFavorite, 
    setRating, 
    enhanceRecipes,
    saveRecipe
  } = useRecipeStorage();

  const handleIngredientsSubmit = async (ingredients: string[], mealType?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4000/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients, mealType }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      
      // Ensure unique IDs by adding timestamp to prevent conflicts between different requests
      const timestamp = Date.now();
      const recipesWithUniqueIds = data.recipes.map((recipe: Recipe, index: number) => ({
        ...recipe,
        id: `${recipe.id}-${timestamp}-${index}`
      }));
      
      const enhancedRecipes = enhanceRecipes(recipesWithUniqueIds);
      setRecipes(enhancedRecipes);
      
      // Save all recipes to storage for favorites functionality
      for (const recipe of enhancedRecipes) {
        await saveRecipe(recipe);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setRefinementModal({
        isOpen: true,
        recipe,
        isLoading: false
      });
    }
  };

  const handleRefinementSubmit = async (recipe: Recipe, instruction: string) => {
    setRefinementModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('http://localhost:4000/api/recipes/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe, instruction }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine recipe');
      }

      const data = await response.json();
      const refinedRecipe = { 
        ...data.refinedRecipe, 
        rating: recipe.rating, 
        isFavorite: recipe.isFavorite 
      };
      
      // Update the recipe in the list
      setRecipes(prevRecipes => 
        prevRecipes.map(r => 
          r.id === recipe.id ? refinedRecipe : r
        )
      );
      
      // Save the refined recipe
      await saveRecipe(refinedRecipe);
    } finally {
      setRefinementModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRefinementModalClose = () => {
    setRefinementModal({
      isOpen: false,
      recipe: null,
      isLoading: false
    });
  };

  const handleFavorite = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    await toggleFavorite(recipeId, recipe);
    
    // Update local state
    setRecipes(prevRecipes =>
      prevRecipes.map(r =>
        r.id === recipeId
          ? { ...r, isFavorite: !r.isFavorite }
          : r
      )
    );
  };

  const handleRatingChange = async (recipeId: string, rating: number) => {
    await setRating(recipeId, rating);
    
    // Update local state
    setRecipes(prevRecipes =>
      prevRecipes.map(r =>
        r.id === recipeId
          ? { ...r, rating }
          : r
      )
    );
  };

  return (
    <>
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

      <RecipeRefinementModal
        isOpen={refinementModal.isOpen}
        onClose={handleRefinementModalClose}
        recipe={refinementModal.recipe}
        onRefine={handleRefinementSubmit}
        isLoading={refinementModal.isLoading}
      />
    </>
  );
}; 