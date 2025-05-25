import React from 'react';

export interface Recipe {
  title: string;
  ingredients: string[];
  steps: string[];
}

interface RecipeListProps {
  recipes: Recipe[];
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
  if (!recipes.length) return null;
  return (
    <div data-testid="recipe-list">
      {recipes.map((recipe, idx) => (
        <div key={idx} className="recipe-card">
          <h2>{recipe.title}</h2>
          <ol>
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
};

export default RecipeList;
