import type { Recipe } from '../../types/Recipe';
import { Card, CardHeader, CardContent, CardFooter } from '../molecules/Card';
import { IngredientsList, StepsList } from '../atoms/List';
import { RecipeActions } from '../molecules/RecipeActions';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
  onRefine?: (recipeId: string) => void;
  onFavorite?: (recipeId: string) => void;
  onRatingChange?: (recipeId: string, rating: number) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onRefine,
  onFavorite,
  onRatingChange,
}) => {
  const handleRefine = () => onRefine?.(recipe.id);
  const handleFavorite = () => onFavorite?.(recipe.id);
  const handleRatingChange = (rating: number) => onRatingChange?.(recipe.id, rating);

  return (
    <Card hover className="recipe-card">
      <CardHeader>
        <h3 className="recipe-card__title">{recipe.title}</h3>
      </CardHeader>
      
      <CardContent>
        <div className="recipe-card__section">
          <h4 className="recipe-card__section-title">Ingredients</h4>
          <IngredientsList items={recipe.ingredients} />
        </div>

        <div className="recipe-card__section">
          <h4 className="recipe-card__section-title">Instructions</h4>
          <StepsList items={recipe.steps} />
        </div>
      </CardContent>

      <CardFooter>
        <RecipeActions
          onRefine={handleRefine}
          onFavorite={handleFavorite}
          onRatingChange={handleRatingChange}
          rating={recipe.rating}
          isFavorite={recipe.isFavorite}
        />
      </CardFooter>
    </Card>
  );
}; 