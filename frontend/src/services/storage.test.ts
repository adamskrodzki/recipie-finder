import { LocalStorageRecipeStorage } from './storage';
import type { Recipe } from '../types/Recipe';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('LocalStorageRecipeStorage', () => {
  let storage: LocalStorageRecipeStorage;
  
  const mockRecipe: Recipe = {
    id: 'test-recipe-1',
    title: 'Test Recipe',
    ingredients: ['ingredient1', 'ingredient2'],
    steps: ['step1', 'step2'],
    rating: 4,
    isFavorite: false
  };

  beforeEach(() => {
    storage = new LocalStorageRecipeStorage();
    localStorage.clear();
  });

  describe('Favorites', () => {
    it('should add and retrieve favorites', async () => {
      await storage.addFavorite(mockRecipe.id);
      const favorites = await storage.getFavorites();
      expect(favorites).toContain(mockRecipe.id);
    });

    it('should remove favorites', async () => {
      await storage.addFavorite(mockRecipe.id);
      await storage.removeFavorite(mockRecipe.id);
      const favorites = await storage.getFavorites();
      expect(favorites).not.toContain(mockRecipe.id);
    });

    it('should check if recipe is favorite', async () => {
      await storage.addFavorite(mockRecipe.id);
      const isFavorite = await storage.isFavorite(mockRecipe.id);
      expect(isFavorite).toBe(true);
    });
  });

  describe('Ratings', () => {
    it('should set and get ratings', async () => {
      await storage.setRating(mockRecipe.id, 5);
      const rating = await storage.getRating(mockRecipe.id);
      expect(rating).toBe(5);
    });

    it('should remove ratings', async () => {
      await storage.setRating(mockRecipe.id, 5);
      await storage.removeRating(mockRecipe.id);
      const rating = await storage.getRating(mockRecipe.id);
      expect(rating).toBeUndefined();
    });

    it('should get all ratings', async () => {
      await storage.setRating('recipe1', 4);
      await storage.setRating('recipe2', 5);
      const ratings = await storage.getAllRatings();
      expect(ratings).toEqual({ recipe1: 4, recipe2: 5 });
    });
  });

  describe('Recipe Storage', () => {
    it('should save and retrieve recipes', async () => {
      await storage.saveRecipe(mockRecipe);
      const retrieved = await storage.getRecipe(mockRecipe.id);
      expect(retrieved).toEqual(mockRecipe);
    });

    it('should get all saved recipes', async () => {
      const recipe2 = { ...mockRecipe, id: 'test-recipe-2', title: 'Test Recipe 2' };
      await storage.saveRecipe(mockRecipe);
      await storage.saveRecipe(recipe2);
      
      const allRecipes = await storage.getAllSavedRecipes();
      expect(allRecipes).toHaveLength(2);
      expect(allRecipes).toContainEqual(mockRecipe);
      expect(allRecipes).toContainEqual(recipe2);
    });

    it('should get favorite recipes', async () => {
      const recipe2 = { ...mockRecipe, id: 'test-recipe-2', title: 'Test Recipe 2' };
      await storage.saveRecipe(mockRecipe);
      await storage.saveRecipe(recipe2);
      await storage.addFavorite(mockRecipe.id);
      
      const favoriteRecipes = await storage.getFavoriteRecipes();
      expect(favoriteRecipes).toHaveLength(1);
      expect(favoriteRecipes[0]).toEqual(mockRecipe);
    });
  });

  describe('Bulk Operations', () => {
    it('should get favorites and ratings together', async () => {
      await storage.addFavorite('recipe1');
      await storage.addFavorite('recipe2');
      await storage.setRating('recipe1', 4);
      await storage.setRating('recipe3', 5);
      
      const result = await storage.getFavoritesAndRatings();
      expect(result.favorites).toEqual(['recipe1', 'recipe2']);
      expect(result.ratings).toEqual({ recipe1: 4, recipe3: 5 });
    });
  });
}); 