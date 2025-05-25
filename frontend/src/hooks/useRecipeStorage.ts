import { useState, useEffect, useCallback } from 'react';
import { recipeStorage } from '../services/storage';
import type { Recipe } from '../types/Recipe';

export interface UseRecipeStorageReturn {
  // State
  favorites: string[];
  ratings: Record<string, number>;
  isLoading: boolean;
  
  // Actions
  toggleFavorite: (recipeId: string, recipe?: Recipe) => Promise<void>;
  setRating: (recipeId: string, rating: number) => Promise<void>;
  removeRating: (recipeId: string) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Helpers
  isFavorite: (recipeId: string) => boolean;
  getRating: (recipeId: string) => number | undefined;
  
  // Recipe enhancement
  enhanceRecipes: (recipes: Recipe[]) => Recipe[];
  
  // Favorites management
  getFavoriteRecipes: () => Promise<Recipe[]>;
}

export const useRecipeStorage = (): UseRecipeStorageReturn => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await recipeStorage.getFavoritesAndRatings();
        setFavorites(data.favorites);
        setRatings(data.ratings);
      } catch (error) {
        console.error('Error loading recipe storage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (recipeId: string, recipe?: Recipe) => {
    try {
      const currentFavorites = await recipeStorage.getFavorites();
      const isFav = currentFavorites.includes(recipeId);
      
      if (isFav) {
        await recipeStorage.removeFavorite(recipeId);
        setFavorites(prev => prev.filter(id => id !== recipeId));
      } else {
        // Save the recipe data if provided
        if (recipe) {
          await recipeStorage.saveRecipe(recipe);
        }
        await recipeStorage.addFavorite(recipeId);
        setFavorites(prev => [...prev, recipeId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, []);

  // Set rating for a recipe
  const setRecipeRating = useCallback(async (recipeId: string, rating: number) => {
    try {
      await recipeStorage.setRating(recipeId, rating);
      setRatings(prev => ({ ...prev, [recipeId]: rating }));
    } catch (error) {
      console.error('Error setting rating:', error);
    }
  }, []);

  // Remove rating for a recipe
  const removeRecipeRating = useCallback(async (recipeId: string) => {
    try {
      await recipeStorage.removeRating(recipeId);
      setRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[recipeId];
        return newRatings;
      });
    } catch (error) {
      console.error('Error removing rating:', error);
    }
  }, []);

  // Check if recipe is favorite
  const isFavorite = useCallback((recipeId: string): boolean => {
    return favorites.includes(recipeId);
  }, [favorites]);

  // Get rating for a recipe
  const getRating = useCallback((recipeId: string): number | undefined => {
    return ratings[recipeId];
  }, [ratings]);

  // Enhance recipes with favorite and rating data
  const enhanceRecipes = useCallback((recipes: Recipe[]): Recipe[] => {
    return recipes.map(recipe => ({
      ...recipe,
      isFavorite: isFavorite(recipe.id),
      rating: getRating(recipe.id)
    }));
  }, [isFavorite, getRating]);

  // Save a recipe to storage
  const saveRecipe = useCallback(async (recipe: Recipe) => {
    try {
      await recipeStorage.saveRecipe(recipe);
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  }, []);

  // Get favorite recipes from storage
  const getFavoriteRecipes = useCallback(async (): Promise<Recipe[]> => {
    try {
      const favoriteRecipes = await recipeStorage.getFavoriteRecipes();
      // Enhance with current ratings
      return favoriteRecipes.map(recipe => ({
        ...recipe,
        isFavorite: true,
        rating: ratings[recipe.id] || recipe.rating
      }));
    } catch (error) {
      console.error('Error getting favorite recipes:', error);
      return [];
    }
  }, [ratings]);

  // Refresh data from storage
  const refreshData = useCallback(async () => {
    try {
      const data = await recipeStorage.getFavoritesAndRatings();
      setFavorites(data.favorites);
      setRatings(data.ratings);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  return {
    // State
    favorites,
    ratings,
    isLoading,
    
    // Actions
    toggleFavorite,
    setRating: setRecipeRating,
    removeRating: removeRecipeRating,
    saveRecipe,
    refreshData,
    
    // Helpers
    isFavorite,
    getRating,
    
    // Recipe enhancement
    enhanceRecipes,
    
    // Favorites management
    getFavoriteRecipes
  };
}; 