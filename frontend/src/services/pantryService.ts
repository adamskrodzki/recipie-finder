import { supabase } from './supabaseClient';
import type { Database } from '../types/supabase';

// Define more specific types based on generated Supabase types for clarity
type PantryItemRow = Database['public']['Tables']['user_pantry_items']['Row'];
type PantryItemInsert = Database['public']['Tables']['user_pantry_items']['Insert'];
type PantryItemUpdate = Database['public']['Tables']['user_pantry_items']['Update'];

/**
 * Fetches all pantry items for a given user.
 * @param userId The ID of the user whose pantry items are to be fetched.
 * @returns A promise that resolves to an array of pantry items.
 * @throws Throws an error if the fetch operation fails.
 */
export async function getPantryItems(userId: string): Promise<PantryItemRow[]> {
  if (!userId) {
    console.warn('getPantryItems called without a userId.');
    return [];
  }
  const { data, error } = await supabase
    .from('user_pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching pantry items:', error);
    throw error;
  }
  return data || [];
}

/**
 * Adds a new item to the user's pantry.
 * @param item The pantry item to add (must include user_id and ingredient_name).
 * @returns A promise that resolves to the added pantry item or null if an error occurs.
 * @throws Throws an error if the insert operation fails.
 */
export async function addPantryItem(item: PantryItemInsert): Promise<PantryItemRow | null> {
  if (!item.user_id || !item.ingredient_name) {
    console.error('addPantryItem requires user_id and ingredient_name.');
    throw new Error('User ID and ingredient name are required to add a pantry item.');
  }
  const { data, error } = await supabase
    .from('user_pantry_items')
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error('Error adding pantry item:', error);
    // Handle specific errors, e.g., unique constraint violation (duplicate item)
    if (error.code === '23505') { // PostgreSQL unique violation code
      console.warn('Attempted to add a duplicate pantry item.');
      throw new Error(`Pantry item '${item.ingredient_name}' already exists.`);
    }
    throw error;
  }
  return data;
}

/**
 * Removes a pantry item by its ID.
 * RLS policy should ensure only the owner can delete.
 * @param itemId The ID of the pantry item to remove.
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
}

/**
 * Updates an existing pantry item by its ID.
 * (Currently not specified in requirements, but good for a complete service)
 * RLS policy should ensure only the owner can update.
 * @param itemId The ID of the pantry item to update.
 * @param updates An object containing the fields to update.
 * @returns A promise that resolves to the updated pantry item or null if an error occurs.
 * @throws Throws an error if the update operation fails.
 */
export async function updatePantryItem(itemId: string, updates: PantryItemUpdate): Promise<PantryItemRow | null> {
  if (!itemId) {
    console.error('updatePantryItem called without an itemId.');
    throw new Error('Item ID is required to update a pantry item.');
  }
  if (Object.keys(updates).length === 0) {
    console.warn('updatePantryItem called with no updates.');
    const currentItem = await supabase.from('user_pantry_items').select('*').eq('id', itemId).single();
    return currentItem.data;
  }

  const { data, error } = await supabase
    .from('user_pantry_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating pantry item:', error);
    throw error;
  }
  return data;
} 