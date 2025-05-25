export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
}

export interface RecipeRequest {
  ingredients: string[];
} 