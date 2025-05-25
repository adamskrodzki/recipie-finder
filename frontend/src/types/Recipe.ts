export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  rating?: number;
  isFavorite?: boolean;
}

export interface RecipeRequest {
  ingredients: string[];
}

export interface RecipeResponse {
  recipes: Recipe[];
} 