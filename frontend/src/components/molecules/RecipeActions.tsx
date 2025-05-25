import { Button } from '../atoms/Button';
import { StarRating } from '../atoms/StarRating';
import './RecipeActions.css';

interface RecipeActionsProps {
  onRefine?: () => void;
  onFavorite?: () => void;
  onRatingChange?: (rating: number) => void;
  rating?: number;
  isFavorite?: boolean;
}

export const RecipeActions: React.FC<RecipeActionsProps> = ({
  onRefine,
  onFavorite,
  onRatingChange,
  rating = 0,
  isFavorite = false,
}) => {
  return (
    <div className="recipe-actions">
      <div className="recipe-actions__buttons">
        <Button
          variant="warning"
          size="small"
          onClick={onRefine}
        >
          Refine Recipe
        </Button>
        <Button
          variant="danger"
          size="small"
          onClick={onFavorite}
        >
          {isFavorite ? '♥' : '♡'} Favorite
        </Button>
      </div>
      
      <div className="recipe-actions__rating">
        <span className="recipe-actions__rating-label">Rate:</span>
        <StarRating
          rating={rating}
          onRatingChange={onRatingChange}
          size="small"
        />
      </div>
    </div>
  );
}; 