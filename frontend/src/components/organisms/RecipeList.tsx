import { useState } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? recipes.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === recipes.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentRecipe = recipes[currentIndex];

  return (
    <div className="recipe-list-container">
      <div className="recipe-list__header">
        <h2 className="recipe-list__title">Suggested Recipes</h2>
        <div className="recipe-list__counter">
          {currentIndex + 1} of {recipes.length}
        </div>
      </div>

      <div className="recipe-carousel">
        <div className="recipe-carousel__container">
          {recipes.length > 1 && (
            <button
              className="recipe-carousel__nav recipe-carousel__nav--prev"
              onClick={goToPrevious}
              aria-label="Previous recipe"
            >
              ‹
            </button>
          )}

          <div className="recipe-carousel__content">
            <RecipeCard
              key={currentRecipe.id}
              recipe={currentRecipe}
              onRefine={onRefine}
              onFavorite={onFavorite}
              onRatingChange={onRatingChange}
            />
          </div>

          {recipes.length > 1 && (
            <button
              className="recipe-carousel__nav recipe-carousel__nav--next"
              onClick={goToNext}
              aria-label="Next recipe"
            >
              ›
            </button>
          )}
        </div>

        {recipes.length > 1 && (
          <div className="recipe-carousel__indicators">
            {recipes.map((_, index) => (
              <button
                key={index}
                className={`recipe-carousel__indicator ${
                  index === currentIndex ? 'recipe-carousel__indicator--active' : ''
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to recipe ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 