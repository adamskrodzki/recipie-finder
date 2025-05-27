import { supabaseAdmin } from '../supabaseClient';
import type { Database } from '../types/supabase';
import type { Recipe } from '../types';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];

export interface StoredRecipe extends RecipeRow {
  // All fields are already properly typed in RecipeRow
}

/**
 * Stores a new recipe in the database
 */
export async function storeRecipe(
  recipe: Recipe,
  originalIngredients: string[],
  mealType?: string,
  parentRecipeId?: string,
  refinementInstruction?: string
): Promise<StoredRecipe> {
  console.log('Storing recipe:', recipe.title);
  
  try {
    // Prepare recipe data for insertion
    const recipeData: RecipeInsert = {
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      meal_type: mealType || 'any',
      original_prompt_ingredients: originalIngredients,
      parent_recipe_id: parentRecipeId || null,
      refinement_instruction: refinementInstruction || null,
      ai_model_used: 'openai/gpt-4.1-nano'
    };

    // Insert the recipe
    const { data: insertedRecipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError) {
      console.error('Error inserting recipe:', recipeError);
      throw recipeError;
    }

    if (!insertedRecipe) {
      throw new Error('Failed to insert recipe');
    }

    console.log('Recipe stored successfully:', insertedRecipe.id);
    return insertedRecipe;

  } catch (error) {
    console.error('Error in storeRecipe:', error);
    throw error;
  }
}

/**
 * Updates an existing recipe (for refinements)
 */
export async function updateRecipe(
  recipeId: string,
  updatedRecipe: Recipe,
  refinementInstruction: string
): Promise<StoredRecipe> {
  console.log('Updating recipe:', recipeId);
  
  try {
    // Update the recipe
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('recipes')
      .update({
        title: updatedRecipe.title,
        ingredients: updatedRecipe.ingredients,
        steps: updatedRecipe.steps,
        refinement_instruction: refinementInstruction
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating recipe:', updateError);
      throw updateError;
    }

    if (!updatedData) {
      throw new Error('Failed to update recipe');
    }

    console.log('Recipe updated successfully:', recipeId);
    return updatedData;

  } catch (error) {
    console.error('Error in updateRecipe:', error);
    throw error;
  }
}

/**
 * Retrieves a recipe by ID
 */
export async function getRecipeById(recipeId: string): Promise<StoredRecipe | null> {
  try {
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (recipeError) {
      if (recipeError.code === 'PGRST116') {
        return null; // Recipe not found
      }
      console.error('Error fetching recipe:', recipeError);
      throw recipeError;
    }

    return recipe;

  } catch (error) {
    console.error('Error in getRecipeById:', error);
    throw error;
  }
}

/**
 * Searches for recipes by ingredients (case-insensitive partial matching)
 */
export async function searchRecipesByIngredients(ingredientNames: string[]): Promise<StoredRecipe[]> {
  try {
    if (!ingredientNames || ingredientNames.length === 0) {
      return [];
    }

    // Convert search terms to lowercase for case-insensitive search
    const searchTerms = ingredientNames.map(name => name.toLowerCase().trim());
    
    // Get all recipes
    const { data: allRecipes, error: searchError } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchError) {
      console.error('Error searching recipes by ingredients:', searchError);
      throw searchError;
    }

    if (!allRecipes || allRecipes.length === 0) {
      return [];
    }

    // Filter recipes that contain any of the search ingredients
    const matchingRecipes = allRecipes.filter(recipe => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return false;
      }
      
      // Check if any search term matches any ingredient in the recipe
      return searchTerms.some(searchTerm => 
        recipe.ingredients.some((ingredient: string) => 
          ingredient.toLowerCase().includes(searchTerm)
        )
      );
    });

    // Sort by relevance (recipes with more matching ingredients first)
    const sortedRecipes = matchingRecipes.sort((a, b) => {
      const aMatches = searchTerms.filter(searchTerm =>
        a.ingredients.some((ingredient: string) => 
          ingredient.toLowerCase().includes(searchTerm)
        )
      ).length;
      
      const bMatches = searchTerms.filter(searchTerm =>
        b.ingredients.some((ingredient: string) => 
          ingredient.toLowerCase().includes(searchTerm)
        )
      ).length;
      
      return bMatches - aMatches; // Sort by most matches first
    });

    return sortedRecipes;

  } catch (error) {
    console.error('Error in searchRecipesByIngredients:', error);
    throw error;
  }
}

/**
 * Gets all recipes, optionally filtered by meal type
 */
export async function getAllRecipes(mealType?: string): Promise<StoredRecipe[]> {
  try {
    let query = supabaseAdmin
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (mealType && mealType !== 'any') {
      query = query.eq('meal_type', mealType);
    }

    const { data: recipes, error } = await query;

    if (error) {
      console.error('Error fetching all recipes:', error);
      throw error;
    }

    return recipes || [];

  } catch (error) {
    console.error('Error in getAllRecipes:', error);
    throw error;
  }
}

/**
 * Gets recipes that are refinements of a parent recipe
 */
export async function getRecipeRefinements(parentRecipeId: string): Promise<StoredRecipe[]> {
  try {
    const { data: refinements, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('parent_recipe_id', parentRecipeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipe refinements:', error);
      throw error;
    }

    return refinements || [];

  } catch (error) {
    console.error('Error in getRecipeRefinements:', error);
    throw error;
  }
} 