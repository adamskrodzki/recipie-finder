import { useState, useEffect, useCallback } from 'react';
import * as pantryService from '../services/pantryService';
import { useAuth } from './useAuth';
import type { PantryItemRich } from '../services/pantryService'; 
import type { Database } from '../types/supabase';

// The hook will primarily work with PantryItemRich which includes the ingredient_name.
export type PantryItem = PantryItemRich;

// Request types for hook's public interface
// addItem still takes a name, the service will resolve it to an ID.
export type CreatePantryItemRequest = { name: string; /* other fields like quantity, unit if added */ };

// UpdatePantryItemRequest now allows for name change, and other fields directly from UserPantryItemRow
// but omits fields managed by the DB or service logic internally for this specific request structure.
// The service's update type is more flexible; this is what the hook exposes.
export type UpdatePantryItemRequest = 
  Partial<Omit<Database['public']['Tables']['user_pantry_items']['Row'], 'id' | 'user_id' | 'added_at' | 'updated_at' | 'pantry_ingredient_id'>> & 
  { ingredient_name?: string }; // Allow changing the ingredient by name

export interface UsePantryStorageReturn {
  items: PantryItem[];
  isLoading: boolean;
  initialLoading: boolean;
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
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPantryItems = useCallback(async (currentUserId: string, isInitialLoad = false) => {
    if (!currentUserId) {
      setItems([]);
      return;
    }
    if (isInitialLoad) {
      setInitialLoading(true);
    }
    setError(null);
    try {
      // pantryService.getPantryItems now returns PantryItemRich[]
      const fetchedItems = await pantryService.getPantryItems(currentUserId);
      // Ensure all fetched items have a valid added_at or provide a fallback
      // and that ingredient_name is present (which it should be from PantryItemRich)
      const processedItems = fetchedItems.map(item => ({
        ...item,
        added_at: item.added_at || new Date().toISOString(),
        // ingredient_name is already part of PantryItemRich, no need for pantry_ingredients check here for name
      }));
      setItems(processedItems);
    } catch (err) {
      console.error('Failed to load pantry items:', err);
      setError(getErrorMessage(err));
      setItems([]);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      }
    }
  }, []);

  // Silent refetch for cache invalidation - doesn't trigger loading states
  const silentRefetch = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setItems([]);
      return;
    }
    try {
      const fetchedItems = await pantryService.getPantryItems(currentUserId);
      const processedItems = fetchedItems.map(item => ({
        ...item,
        added_at: item.added_at || new Date().toISOString(),
      }));
      setItems(processedItems);
    } catch (err) {
      console.error('Failed to silently refetch pantry items:', err);
      // Don't update error state during silent refetch to avoid UI disruption
    }
  }, []);

  // Subscribe to cache invalidation events
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = pantryService.subscribeToCacheInvalidation(() => {
      console.log('Cache invalidated, silently refetching pantry items for user:', user.id);
      silentRefetch(user.id);
    });

    return unsubscribe;
  }, [user?.id, silentRefetch]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadPantryItems(user.id, true); // Mark as initial load
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

    setError(null);
    try {
      // pantryService.addPantryItem now takes { user_id, ingredient_name, ...other_fields }
      // and returns PantryItemRich or null
      await pantryService.addPantryItem({
          user_id: currentUserId, 
          ingredient_name: itemRequest.name,
          // Pass other fields from itemRequest if they exist e.g. quantity, unit
      });
      // Cache invalidation will trigger silent refetch automatically
    } catch (err) {
      console.error('Failed to add pantry item:', err);
      setError(getErrorMessage(err));
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
    // If ingredient_name is being updated, ensure it's not empty
    if (typeof updates.ingredient_name === 'string' && updates.ingredient_name.trim() === '') {
        setError('Ingredient name cannot be empty when updating.');
        console.error('updateItemHandler: ingredient_name update is empty.');
        return;
    }

    setError(null);
    try {
      // pantryService.updatePantryItem now takes (id, updates) where updates can include ingredient_name
      // and returns PantryItemRich or null
      await pantryService.updatePantryItem(id, updates);
      // Cache invalidation will trigger silent refetch automatically
    } catch (err) {
      console.error('Failed to update pantry item:', err);
      setError(getErrorMessage(err));
    }
  };

  const removeItemHandler = async (id: string): Promise<void> => {
    if (!user?.id) { // No need to ensureSession just to check for user.id before calling service
      setError('User session not available. Cannot remove pantry item.');
      // The service itself doesn't need user.id, only itemId, RLS handles auth.
      // However, it's good practice for the hook to Gate this if it implies user context.
      // Let's keep this check for consistency, though the service call would proceed.
      return;
    }
    setError(null);
    try {
      await pantryService.removePantryItem(id);
      // Cache invalidation will trigger silent refetch automatically
    } catch (err) {
      console.error('Failed to remove pantry item:', err);
      setError(getErrorMessage(err));
    }
  };

  const refreshItemsHandler = useCallback(async (): Promise<void> => {
    if (user?.id) {
      await loadPantryItems(user.id);
    }
  }, [user, loadPantryItems]);

  return {
    items,
    isLoading: false, // Operations don't set loading states anymore
    initialLoading: initialLoading || authLoading,
    error,
    addItem: addItemHandler,
    updateItem: updateItemHandler,
    removeItem: removeItemHandler,
    refreshItems: refreshItemsHandler,
  };
}; 