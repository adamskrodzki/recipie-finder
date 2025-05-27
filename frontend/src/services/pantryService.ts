import { supabase } from './supabaseClient';
import type { Database } from '../types/supabase';

// Base Supabase row types (assuming types are regenerated after migration)
export type UserPantryItemRow = Database['public']['Tables']['user_pantry_items']['Row']; // Expects pantry_ingredient_id
export type PantryIngredientRow = Database['public']['Tables']['pantry_ingredients']['Row'];

// Define the shape of the item returned by the service (with ingredient name)
export interface PantryItemRich extends UserPantryItemRow {
  // user_pantry_items.id, user_id, pantry_ingredient_id, quantity, unit, added_at, updated_at
  pantry_ingredients: Pick<PantryIngredientRow, 'name'> | null; // From join
  // For easier access in the hook, we'll add ingredient_name directly.
  ingredient_name: string; 
}

// For inserting a new user pantry item, we use the ingredient name
type UserPantryItemServiceInsert = {
  user_id: string;
  ingredient_name: string;
  // other fields from user_pantry_items.Insert, if any (e.g. quantity, unit)
  // For now, assuming only user_id and ingredient_name are primary for 'add' operation via hook
};

// For updating, we might update fields on user_pantry_items, or even change the ingredient
// The 'updates' type for Supabase will expect pantry_ingredient_id if changing ingredient
type UserPantryItemServiceUpdate = Partial<Omit<UserPantryItemRow, 'id' | 'user_id' | 'added_at' | 'updated_at' | 'pantry_ingredient_id'>> & {
    ingredient_name?: string; // If name changes, we resolve to new pantry_ingredient_id
    pantry_ingredient_id?: string; // Or allow direct update of ID
};

// Cache configuration
const CACHE_TTL_MS = 30 * 1000; // 5 minutes

interface CacheEntry {
  data: PantryItemRich[];
  timestamp: number;
  userId: string;
}

// In-memory cache for pantry items
let pantryItemsCache: CacheEntry | null = null;

// Event system for cache invalidation
type CacheInvalidationListener = () => void;
const cacheInvalidationListeners: Set<CacheInvalidationListener> = new Set();

/**
 * Subscribe to cache invalidation events
 */
export function subscribeToCacheInvalidation(listener: CacheInvalidationListener): () => void {
  cacheInvalidationListeners.add(listener);
  
  // Return unsubscribe function
  return () => {
    cacheInvalidationListeners.delete(listener);
  };
}

/**
 * Notify all listeners that cache has been invalidated
 */
function notifyCacheInvalidation(): void {
  cacheInvalidationListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Error in cache invalidation listener:', error);
    }
  });
}

/**
 * Clears the pantry items cache
 */
function clearPantryItemsCache(): void {
  pantryItemsCache = null;
  console.log('Cache cleared, notifying listeners');
  notifyCacheInvalidation();
}

/**
 * Clears the pantry items cache (exported version)
 */
export function clearPantryCache(): void {
  clearPantryItemsCache();
}

/**
 * Checks if cached data is still valid
 */
function isCacheValid(userId: string): boolean {
  if (!pantryItemsCache) return false;
  if (pantryItemsCache.userId !== userId) return false;
  
  const now = Date.now();
  const isExpired = (now - pantryItemsCache.timestamp) > CACHE_TTL_MS;
  
  if (isExpired) {
    clearPantryItemsCache();
    return false;
  }
  
  return true;
}

/**
 * Sets cache data
 */
function setCacheData(userId: string, data: PantryItemRich[]): void {
  pantryItemsCache = {
    data,
    timestamp: Date.now(),
    userId
  };
}

/**
 * Fetches a specific ingredient by name, or creates it if it doesn't exist.
 * @param name The name of the ingredient.
 * @returns A promise that resolves to the ingredient row (id, name).
 * @throws Throws an error if the operation fails.
 */
async function getOrCreateIngredient(name: string): Promise<PantryIngredientRow> {
  const trimmedName = name.trim().toLocaleLowerCase();;
  if (!trimmedName) {
    throw new Error('Ingredient name cannot be empty.');
  }

  // Check if ingredient exists
  const { data: existingIngredient, error: selectError } = await supabase
    .from('pantry_ingredients')
    .select('id, name, created_at')
    .eq('name', trimmedName)
    .single();

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "Object not found"
    console.error('Error fetching ingredient by name:', selectError);
    throw selectError;
  }

  if (existingIngredient) {
    return existingIngredient;
  }

  // Ingredient doesn't exist, create it
  const { data: newIngredient, error: insertError } = await supabase
    .from('pantry_ingredients')
    .insert({ name: trimmedName })
    .select('id, name, created_at')
    .single();

  if (insertError) {
    console.error('Error creating new ingredient:', insertError);
    if (insertError.code === '23505') { 
      const { data: concurrentlyInserted, error: fetchAgainError } = await supabase
        .from('pantry_ingredients')
        .select('id, name, created_at')
        .eq('name', trimmedName)
        .single();
      if (fetchAgainError) {
         console.error('Error fetching concurrently inserted ingredient:', fetchAgainError);
         throw fetchAgainError;
      }
      if (concurrentlyInserted) return concurrentlyInserted;
    }
    throw insertError;
  }
  if (!newIngredient) {
    throw new Error('Failed to create or retrieve ingredient, newIngredient is null.');
  }
  return newIngredient;
}

/**
 * Searches for pantry ingredients by name (case-insensitive substring match).
 * @param query The search string (at least 3 characters).
 * @returns A promise that resolves to an array of matching pantry ingredients (id, name, created_at), limited to 50.
 * @throws Throws an error if the operation fails.
 */
export async function searchIngredientsByName(query: string): Promise<PantryIngredientRow[]> {
  const trimmedQuery = query.trim().toLocaleLowerCase();
  if (trimmedQuery.length < 3) {
    return []; // Return empty if query is too short, as per requirement
  }

  const { data, error } = await supabase
    .from('pantry_ingredients')
    .select('id, name, created_at')
    .ilike('name', `%${trimmedQuery}%`) // Case-insensitive LIKE
    .limit(50);

  if (error) {
    console.error('Error searching ingredients by name:', error);
    throw error;
  }

  return data || [];
}

function processPantryItemQueryResult(
  item: UserPantryItemRow & { pantry_ingredients: { name: string } | null }
): PantryItemRich {
  return {
    ...item,
    ingredient_name: item.pantry_ingredients?.name || 'Unknown Ingredient',
  };
}


/**
 * Fetches all pantry items for a given user, including ingredient names.
 * @param userId The ID of the user whose pantry items are to be fetched.
 * @returns A promise that resolves to an array of pantry items with names.
 * @throws Throws an error if the fetch operation fails.
 */
export async function getPantryItems(userId: string): Promise<PantryItemRich[]> {
  if (!userId) {
    console.warn('getPantryItems called without a userId.');
    return [];
  }
  if (isCacheValid(userId)) {
    console.log('Returning cached pantry items for user:', userId);
    return pantryItemsCache!.data;
  }
  const { data, error } = await supabase
    .from('user_pantry_items')
    .select(`
      *,
      pantry_ingredients (name)
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching pantry items:', error);
    throw error;
  }
  // The type of data from query: (UserPantryItemRow & { pantry_ingredients: { name: string } | null })[]
  const processedItems = (data || []).map(processPantryItemQueryResult);
  setCacheData(userId, processedItems);
  console.log('Fetched and processed pantry items for user:', userId);
  return processedItems;
}

/**
 * Adds a new item to the user's pantry.
 * @param item The pantry item to add (must include user_id and ingredient_name).
 * @returns A promise that resolves to the added pantry item with name, or null if an error occurs.
 * @throws Throws an error if the insert operation fails.
 */
export async function addPantryItem(item: UserPantryItemServiceInsert): Promise<PantryItemRich | null> {
  if (!item.user_id || !item.ingredient_name) {
    console.error('addPantryItem requires user_id and ingredient_name.');
    throw new Error('User ID and ingredient name are required to add a pantry item.');
  }

  const ingredient = await getOrCreateIngredient(item.ingredient_name);

  const { data, error } = await supabase
    .from('user_pantry_items')
    .insert({
      user_id: item.user_id,
      pantry_ingredient_id: ingredient.id,
      // any other fields from item if they exist, e.g. item.quantity
    })
    .select(`
      *,
      pantry_ingredients (name)
    `)
    .single();

  if (error) {
    console.error('Error adding pantry item to user_pantry_items:', error);
    if (error.code === '23505') { // Unique violation on (user_id, pantry_ingredient_id)
      // Note: The hook will display the ingredient name from the request.
      throw new Error(`Pantry item '${item.ingredient_name}' already exists for this user.`);
    }
    throw error;
  }
  clearPantryItemsCache();
  console.log('Added pantry item, cache cleared and listeners notified');
  // Process to add ingredient_name at the top level
  return data ? processPantryItemQueryResult(data as UserPantryItemRow & { pantry_ingredients: { name: string } | null }) : null;
}

/**
 * Removes a pantry item by its ID.
 * RLS policy should ensure only the owner can delete.
 * @param itemId The ID of the user_pantry_items entry to remove.
 * @throws Throws an error if the delete operation fails.
 */
export async function removePantryItem(itemId: string): Promise<void> {
  if (!itemId) {
    console.error('removePantryItem called without an itemId.');
    throw new Error('Item ID is required to remove a pantry item.');
  }
  const { error } = await supabase
    .from('user_pantry_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting pantry item:', error);
    throw error;
  }
  clearPantryItemsCache();
}

/**
 * Updates an existing pantry item by its ID.
 * @param itemId The ID of the user_pantry_items entry to update.
 * @param updates An object containing the fields to update. Can include 'ingredient_name' to change ingredient.
 * @returns A promise that resolves to the updated pantry item with name, or null if an error occurs.
 * @throws Throws an error if the update operation fails.
 */
export async function updatePantryItem(itemId: string, updates: UserPantryItemServiceUpdate): Promise<PantryItemRich | null> {
  if (!itemId) {
    console.error('updatePantryItem called without an itemId.');
    throw new Error('Item ID is required to update a pantry item.');
  }

  const { ingredient_name, ...otherUpdates } = updates;
  const pantryUpdatePayload: Database['public']['Tables']['user_pantry_items']['Update'] = { ...otherUpdates };

  if (typeof ingredient_name === 'string') {
    if (ingredient_name.trim() === '') {
        throw new Error('Ingredient name cannot be empty when updating.');
    }
    const ingredient = await getOrCreateIngredient(ingredient_name);
    pantryUpdatePayload.pantry_ingredient_id = ingredient.id;
  }
  
  if (Object.keys(pantryUpdatePayload).length === 0) {
    console.warn('updatePantryItem called with no effective updates.');
    // Fetch and return the current item as if it were updated
    const { data: currentItem, error: fetchError } = await supabase
        .from('user_pantry_items')
        .select('*, pantry_ingredients(name)')
        .eq('id', itemId)
        .single();
    if (fetchError) {
        console.error('Error fetching current item during no-op update:', fetchError);
        throw fetchError;
    }
    return currentItem ? processPantryItemQueryResult(currentItem as UserPantryItemRow & { pantry_ingredients: { name: string } | null }) : null;
  }

  const { data, error } = await supabase
    .from('user_pantry_items')
    .update(pantryUpdatePayload)
    .eq('id', itemId)
    .select(`
      *,
      pantry_ingredients (name)
    `)
    .single();

  if (error) {
    console.error('Error updating pantry item:', error);
     if (error.code === '23505') { // Unique violation on (user_id, pantry_ingredient_id)
      throw new Error(`Another pantry item with the new ingredient '${ingredient_name || 'specified'}' already exists.`);
    }
    throw error;
  }
  clearPantryItemsCache();
  return data ? processPantryItemQueryResult(data as UserPantryItemRow & { pantry_ingredients: { name: string } | null }) : null;
} 