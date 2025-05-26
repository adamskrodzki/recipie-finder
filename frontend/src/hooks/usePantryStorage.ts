import { useState, useEffect, useCallback } from 'react';
import type { PantryItem, CreatePantryItemRequest, UpdatePantryItemRequest } from '../types/Pantry';
import { recipeStorage } from '../services/storage';

export interface UsePantryStorageReturn {
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: CreatePantryItemRequest) => Promise<void>;
  updateItem: (id: string, updates: UpdatePantryItemRequest) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

export const usePantryStorage = (): UsePantryStorageReturn => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const pantryItems = await recipeStorage.getPantryItems();
      setItems(pantryItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pantry items';
      setError(errorMessage);
      console.error('Error loading pantry items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: CreatePantryItemRequest) => {
    try {
      setError(null);
      await recipeStorage.addPantryItem(item);
      await refreshItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add pantry item';
      setError(errorMessage);
      console.error('Error adding pantry item:', err);
      throw err;
    }
  }, [refreshItems]);

  const updateItem = useCallback(async (id: string, updates: UpdatePantryItemRequest) => {
    try {
      setError(null);
      await recipeStorage.updatePantryItem(id, updates);
      await refreshItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pantry item';
      setError(errorMessage);
      console.error('Error updating pantry item:', err);
      throw err;
    }
  }, [refreshItems]);

  const removeItem = useCallback(async (id: string) => {
    try {
      setError(null);
      await recipeStorage.removePantryItem(id);
      await refreshItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove pantry item';
      setError(errorMessage);
      console.error('Error removing pantry item:', err);
      throw err;
    }
  }, [refreshItems]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  return {
    items,
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    refreshItems,
  };
}; 