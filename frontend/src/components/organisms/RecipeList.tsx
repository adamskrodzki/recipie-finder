import type { Recipe } from '../../types/Recipe';
import { RecipeCard } from './RecipeCard';
import './RecipeList.css';

interface RecipeListProps {
  recipes: Recipe[];
  isLoading?: boolean;
  onRefine?: (recipeId: string) => void;
  onFavorite?: (recipeId: string) => void;
  onRatingChange?: (recipeId: string, rating: number) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({ 
  recipes, 
  isLoading = false,
  onRefine,
  onFavorite,
  onRatingChange,
}) => {
  if (isLoading) {
    return (
      <div className="recipe-list-container">
        <div className="recipe-list__loading">
          <div className="recipe-list__spinner" role="status" aria-label="Loading recipes"></div>
          <p>Finding delicious recipes for you...</p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="recipe-list-container">
      <h2 className="recipe-list__title">Suggested Recipes</h2>
      <div className="recipe-list__grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onRefine={onRefine}
            onFavorite={onFavorite}
            onRatingChange={onRatingChange}
          />
        ))}
      </div>
    </div>
  );
}; 