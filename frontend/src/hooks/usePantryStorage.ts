import { useState, useEffect, useCallback } from 'react';
import * as pantryService from '../services/pantryService';
import { useAuth } from './useAuth';
import type { Database } from '../types/supabase'; // For PantryItemRow type

// Explicitly type PantryItem based on Supabase schema
export type PantryItem = Database['public']['Tables']['user_pantry_items']['Row'];

// Request types for hook's public interface
export type CreatePantryItemRequest = { name: string };
export type UpdatePantryItemRequest = Database['public']['Tables']['user_pantry_items']['Update'];

export interface UsePantryStorageReturn {
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: CreatePantryItemRequest) => Promise<void>;
  updateItem: (id: string, updates: UpdatePantryItemRequest) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

// Refined helper to get a string message from various error types
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object' && error !== null) {
    const errWithMessage = error as { message?: unknown }; 
    if (typeof errWithMessage.message === 'string') {
      return errWithMessage.message;
    }
  }
  
  if (error instanceof Error) return error.message;

  return 'An unknown error occurred';
}

export const usePantryStorage = (): UsePantryStorageReturn => {
  const { user, isLoading: authLoading, ensureSession } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPantryItems = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await pantryService.getPantryItems(currentUserId);
      // Ensure all fetched items have a valid added_at or provide a fallback
      const processedItems = fetchedItems.map(item => ({
        ...item,
        added_at: item.added_at || new Date().toISOString(), // Fallback for existing items if needed
      }));
      setItems(processedItems);
    } catch (err) {
      console.error('Failed to load pantry items:', err);
      setError(getErrorMessage(err));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadPantryItems(user.id);
    } else if (!authLoading && !user) {
      setItems([]);
    }
  }, [user, authLoading, loadPantryItems]);

  const addItemHandler = async (itemRequest: CreatePantryItemRequest): Promise<void> => {
    let currentUserId = user?.id;
    if (!currentUserId) {
      const session = await ensureSession();
      currentUserId = session?.user?.id;
      if (!currentUserId) {
        setError('User session not available. Cannot add pantry item.');
        console.error('User ID not available after ensuring session for addItem.');
        return;
      }
    }

    if (!itemRequest || typeof itemRequest.name !== 'string' || itemRequest.name.trim() === '') {
      setError('Ingredient name cannot be empty.');
      console.error('addItemHandler: ingredient name (from itemRequest.name) is empty or invalid.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const newItem = await pantryService.addPantryItem({ 
          user_id: currentUserId, 
          ingredient_name: itemRequest.name
      });
      if (newItem) {
        // Ensure added_at is present for optimistic update, fallback if necessary
        const itemToAdd: PantryItem = {
            ...newItem,
            added_at: newItem.added_at || new Date().toISOString(),
        };
        setItems(prevItems => [...prevItems, itemToAdd].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()));
      }
    } catch (err) {
      console.error('Failed to add pantry item:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemHandler = async (id: string, updates: UpdatePantryItemRequest): Promise<void> => {
    let currentUserId = user?.id;
    if (!currentUserId) {
      const session = await ensureSession();
      currentUserId = session?.user?.id;
      if (!currentUserId) {
        setError('User session not available. Cannot update pantry item.');
        console.error('User ID not available after ensuring session for updateItem.');
        return;
      }
    }

    if (Object.keys(updates).length === 0) {
      console.warn('updateItemHandler called with no updates.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const updatedItem = await pantryService.updatePantryItem(id, updates);
      if (updatedItem) {
        // Ensure added_at is present for optimistic update, fallback if necessary
        // Note: added_at typically shouldn't change on update, but defensive check here based on PantryItem type.
        const itemToUpdate: PantryItem = {
            ...updatedItem,
            added_at: updatedItem.added_at || items.find(i => i.id === id)?.added_at || new Date().toISOString(),
        };
        setItems(prevItems =>
          prevItems
            .map(item => (item.id === id ? itemToUpdate : item))
            .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
        );
      }
    } catch (err) {
      console.error('Failed to update pantry item:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const removeItemHandler = async (id: string): Promise<void> => {
    if (!user?.id) {
      setError('User session not available. Cannot remove pantry item.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await pantryService.removePantryItem(id);
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to remove pantry item:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshItemsHandler = useCallback(async (): Promise<void> => {
    if (user?.id) {
      await loadPantryItems(user.id);
    }
  }, [user, loadPantryItems]);

  return {
    items,
    isLoading: isLoading || authLoading, 
    error,
    addItem: addItemHandler,
    updateItem: updateItemHandler,
    removeItem: removeItemHandler,
    refreshItems: refreshItemsHandler,
  };
}; 