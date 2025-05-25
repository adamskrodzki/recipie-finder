import type { Recipe } from '../types/Recipe';
import './RecipeList.css';

interface RecipeListProps {
  recipes: Recipe[];
  isLoading?: boolean;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="recipe-list-container">
        <div className="loading-state">
          <div className="loading-spinner" role="status" aria-label="Loading recipes"></div>
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
      <h2 className="recipe-list-title">Suggested Recipes</h2>
      <div className="recipe-list">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card">
            <div className="recipe-header">
              <h3 className="recipe-title">{recipe.title}</h3>
            </div>
            
            <div className="recipe-content">
              <div className="recipe-section">
                <h4 className="section-title">Ingredients</h4>
                <ul className="ingredients-list">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="ingredient-item">
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="recipe-section">
                <h4 className="section-title">Instructions</h4>
                <ol className="steps-list">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="step-item">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="recipe-actions">
              <button className="action-button refine-button">
                Refine Recipe
              </button>
              <button className="action-button favorite-button">
                ♡ Favorite
              </button>
              <div className="rating-section">
                <span className="rating-label">Rate:</span>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="star-button"
                      aria-label={`Rate ${star} stars`}
                    >
                      ☆
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 