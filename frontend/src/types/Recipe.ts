export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  rating?: number;
  isFavorite?: boolean;
  mealType?: string;
}

export interface RecipeRequest {
  ingredients: string[];
}

export interface RecipeResponse {
  recipes: Recipe[];
}

export interface RecipeRefinementRequest {
  recipe: Recipe;
  instruction: string;
}

export interface RecipeRefinementResponse {
  refinedRecipe: Recipe;
} 