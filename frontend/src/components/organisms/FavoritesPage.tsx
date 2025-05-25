import { useState, useEffect } from 'react';
import { useRecipeStorage } from '../../hooks/useRecipeStorage';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '../../types/Recipe';
import './FavoritesPage.css';

export const FavoritesPage: React.FC = () => {
  const { 
    isLoading: storageLoading, 
    toggleFavorite, 
    setRating,
    getFavoriteRecipes,
    refreshData
  } = useRecipeStorage();
  
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        const favs = await getFavoriteRecipes();
        setFavoriteRecipes(favs);
      } catch (error) {
        console.error('Error loading favorite recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!storageLoading) {
      loadFavorites();
    }
  }, [getFavoriteRecipes, storageLoading]);

  const handleRemoveFavorite = async (recipeId: string) => {
    await toggleFavorite(recipeId);
    // Refresh data and reload favorites after removal
    await refreshData();
    const favs = await getFavoriteRecipes();
    setFavoriteRecipes(favs);
  };

  const handleRatingChange = async (recipeId: string, rating: number) => {
    await setRating(recipeId, rating);
    // Update the local state immediately
    setFavoriteRecipes(prev => 
      prev.map(recipe => 
        recipe.id === recipeId ? { ...recipe, rating } : recipe
      )
    );
  };

  if (isLoading) {
    return (
      <div className="favorites-page">
        <div className="favorites-page__header">
          <h1 className="favorites-page__title">My Favorite Recipes</h1>
        </div>
        <div className="favorites-page__loading">
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (favoriteRecipes.length === 0) {
    return (
      <div className="favorites-page">
        <div className="favorites-page__header">
          <h1 className="favorites-page__title">My Favorite Recipes</h1>
        </div>
        <div className="favorites-page__empty">
          <div className="favorites-page__empty-content">
            <h2>No favorites yet</h2>
            <p>Start exploring recipes and mark your favorites to see them here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-page__header">
        <h1 className="favorites-page__title">My Favorite Recipes</h1>
        <p className="favorites-page__subtitle">
          {favoriteRecipes.length} favorite recipe{favoriteRecipes.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="favorites-page__grid">
        {favoriteRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onFavorite={handleRemoveFavorite}
            onRatingChange={handleRatingChange}
          />
        ))}
      </div>
    </div>
  );
}; 