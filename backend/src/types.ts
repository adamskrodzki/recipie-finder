export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  mealType?: string;
}

export interface RecipeResponse {
  recipes: Recipe[];
}

export interface RecipeRequest {
  ingredients: string[];
  mealType?: string;
}

export interface RecipeRefinementRequest {
  recipe: Recipe;
  instruction: string;
}

export interface RecipeRefinementResponse {
  refinedRecipe: Recipe;
} 