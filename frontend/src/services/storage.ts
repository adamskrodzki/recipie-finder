import type { Recipe } from '../types/Recipe';
import type { PantryItem, CreatePantryItemRequest, UpdatePantryItemRequest } from '../types/Pantry';

// Storage interface for recipe favorites and ratings
export interface RecipeStorage {
  getFavorites(): Promise<string[]>;
  addFavorite(recipeId: string): Promise<void>;
  removeFavorite(recipeId: string): Promise<void>;
  isFavorite(recipeId: string): Promise<boolean>;
  
  getRating(recipeId: string): Promise<number | undefined>;
  setRating(recipeId: string, rating: number): Promise<void>;
  removeRating(recipeId: string): Promise<void>;
  
  getAllRatings(): Promise<Record<string, number>>;
  
  // Recipe data storage
  saveRecipe(recipe: Recipe): Promise<void>;
  getRecipe(recipeId: string): Promise<Recipe | undefined>;
  getAllSavedRecipes(): Promise<Recipe[]>;
  getFavoriteRecipes(): Promise<Recipe[]>;
  
  // Bulk operations for efficiency
  getFavoritesAndRatings(): Promise<{
    favorites: string[];
    ratings: Record<string, number>;
  }>;
  
  // Pantry management
  getPantryItems(): Promise<PantryItem[]>;
  addPantryItem(item: CreatePantryItemRequest): Promise<PantryItem>;
  updatePantryItem(id: string, updates: UpdatePantryItemRequest): Promise<PantryItem>;
  removePantryItem(id: string): Promise<void>;
  getPantryItem(id: string): Promise<PantryItem | undefined>;
}

// LocalStorage implementation
export class LocalStorageRecipeStorage implements RecipeStorage {
  private readonly FAVORITES_KEY = 'recipe-finder-favorites';
  private readonly RATINGS_KEY = 'recipe-finder-ratings';
  private readonly RECIPES_KEY = 'recipe-finder-recipes';
  private readonly PANTRY_KEY = 'recipe-finder-pantry';

  async getFavorites(): Promise<string[]> {
    try {
      const stored = localStorage.getItem(this.FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading favorites from localStorage:', error);
      return [];
    }
  }

  async addFavorite(recipeId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(recipeId)) {
        favorites.push(recipeId);
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite to localStorage:', error);
    }
  }

  async removeFavorite(recipeId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter(id => id !== recipeId);
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite from localStorage:', error);
    }
  }

  async isFavorite(recipeId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(recipeId);
  }

  async getRating(recipeId: string): Promise<number | undefined> {
    try {
      const ratings = await this.getAllRatings();
      return ratings[recipeId];
    } catch (error) {
      console.error('Error reading rating from localStorage:', error);
      return undefined;
    }
  }

  async setRating(recipeId: string, rating: number): Promise<void> {
    try {
      const ratings = await this.getAllRatings();
      ratings[recipeId] = rating;
      localStorage.setItem(this.RATINGS_KEY, JSON.stringify(ratings));
    } catch (error) {
      console.error('Error setting rating in localStorage:', error);
    }
  }

  async removeRating(recipeId: string): Promise<void> {
    try {
      const ratings = await this.getAllRatings();
      delete ratings[recipeId];
      localStorage.setItem(this.RATINGS_KEY, JSON.stringify(ratings));
    } catch (error) {
      console.error('Error removing rating from localStorage:', error);
    }
  }

  async getAllRatings(): Promise<Record<string, number>> {
    try {
      const stored = localStorage.getItem(this.RATINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading ratings from localStorage:', error);
      return {};
    }
  }

  async getFavoritesAndRatings(): Promise<{
    favorites: string[];
    ratings: Record<string, number>;
  }> {
    const [favorites, ratings] = await Promise.all([
      this.getFavorites(),
      this.getAllRatings()
    ]);
    
    return { favorites, ratings };
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    try {
      const recipes = await this.getAllSavedRecipes();
      const existingIndex = recipes.findIndex(r => r.id === recipe.id);
      
      if (existingIndex >= 0) {
        recipes[existingIndex] = recipe;
      } else {
        recipes.push(recipe);
      }
      
      localStorage.setItem(this.RECIPES_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipe to localStorage:', error);
    }
  }

  async getRecipe(recipeId: string): Promise<Recipe | undefined> {
    try {
      const recipes = await this.getAllSavedRecipes();
      return recipes.find(recipe => recipe.id === recipeId);
    } catch (error) {
      console.error('Error getting recipe from localStorage:', error);
      return undefined;
    }
  }

  async getAllSavedRecipes(): Promise<Recipe[]> {
    try {
      const stored = localStorage.getItem(this.RECIPES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading recipes from localStorage:', error);
      return [];
    }
  }

  async getFavoriteRecipes(): Promise<Recipe[]> {
    try {
      const [favorites, recipes] = await Promise.all([
        this.getFavorites(),
        this.getAllSavedRecipes()
      ]);
      
      return recipes.filter(recipe => favorites.includes(recipe.id));
    } catch (error) {
      console.error('Error getting favorite recipes from localStorage:', error);
      return [];
    }
  }

  async getPantryItems(): Promise<PantryItem[]> {
    try {
      const stored = localStorage.getItem(this.PANTRY_KEY);
      const items: Array<Omit<PantryItem, 'addedAt' | 'expiresAt'> & { addedAt: string; expiresAt?: string }> = stored ? JSON.parse(stored) : [];
      // Convert date strings back to Date objects
      return items.map((item) => ({
        ...item,
        addedAt: new Date(item.addedAt),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
      }));
    } catch (error) {
      console.error('Error reading pantry items from localStorage:', error);
      return [];
    }
  }

  async addPantryItem(item: CreatePantryItemRequest): Promise<PantryItem> {
    try {
      const items = await this.getPantryItems();
      const newItem: PantryItem = {
        id: crypto.randomUUID(),
        name: item.name.trim(),
        category: item.category?.trim(),
        addedAt: new Date(),
        expiresAt: item.expiresAt,
      };
      
      items.push(newItem);
      localStorage.setItem(this.PANTRY_KEY, JSON.stringify(items));
      return newItem;
    } catch (error) {
      console.error('Error adding pantry item to localStorage:', error);
      throw error;
    }
  }

  async updatePantryItem(id: string, updates: UpdatePantryItemRequest): Promise<PantryItem> {
    try {
      const items = await this.getPantryItems();
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex === -1) {
        throw new Error(`Pantry item with id ${id} not found`);
      }
      
      const updatedItem: PantryItem = {
        ...items[itemIndex],
        ...updates,
        name: updates.name?.trim() || items[itemIndex].name,
        category: updates.category?.trim() || items[itemIndex].category,
      };
      
      items[itemIndex] = updatedItem;
      localStorage.setItem(this.PANTRY_KEY, JSON.stringify(items));
      return updatedItem;
    } catch (error) {
      console.error('Error updating pantry item in localStorage:', error);
      throw error;
    }
  }

  async removePantryItem(id: string): Promise<void> {
    try {
      const items = await this.getPantryItems();
      const filteredItems = items.filter(item => item.id !== id);
      localStorage.setItem(this.PANTRY_KEY, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Error removing pantry item from localStorage:', error);
    }
  }

  async getPantryItem(id: string): Promise<PantryItem | undefined> {
    try {
      const items = await this.getPantryItems();
      return items.find(item => item.id === id);
    } catch (error) {
      console.error('Error getting pantry item from localStorage:', error);
      return undefined;
    }
  }
}

// Factory function to create storage instance
// This makes it easy to switch implementations in the future
export const createRecipeStorage = (): RecipeStorage => {
  return new LocalStorageRecipeStorage();
};

// Singleton instance for the app
export const recipeStorage = createRecipeStorage(); 