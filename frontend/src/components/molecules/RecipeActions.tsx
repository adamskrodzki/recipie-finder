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
  const handleFavoriteClick = () => {
    console.log('=== RECIPE ACTIONS FAVORITE BUTTON CLICKED ===');
    console.log('Current isFavorite:', isFavorite);
    console.log('onFavorite callback:', onFavorite);
    if (onFavorite) {
      console.log('Calling onFavorite callback...');
      onFavorite();
      console.log('onFavorite callback called');
    } else {
      console.warn('No onFavorite callback provided');
    }
    console.log('=== RECIPE ACTIONS FAVORITE CLICK END ===');
  };

  const handleRefineClick = () => {
    console.log('=== RECIPE ACTIONS REFINE BUTTON CLICKED ===');
    console.log('onRefine callback:', onRefine);
    if (onRefine) {
      console.log('Calling onRefine callback...');
      onRefine();
      console.log('onRefine callback called');
    } else {
      console.warn('No onRefine callback provided');
    }
    console.log('=== RECIPE ACTIONS REFINE CLICK END ===');
  };

  const handleRatingChange = (newRating: number) => {
    console.log('=== RECIPE ACTIONS RATING CHANGED ===');
    console.log('New rating:', newRating);
    console.log('onRatingChange callback:', onRatingChange);
    if (onRatingChange) {
      console.log('Calling onRatingChange callback...');
      onRatingChange(newRating);
      console.log('onRatingChange callback called');
    } else {
      console.warn('No onRatingChange callback provided');
    }
    console.log('=== RECIPE ACTIONS RATING CHANGE END ===');
  };

  return (
    <div className="recipe-actions">
      <div className="recipe-actions__buttons">
        <Button
          variant="warning"
          size="small"
          onClick={handleRefineClick}
        >
          Refine Recipe
        </Button>
        <Button
          variant="danger"
          size="small"
          onClick={handleFavoriteClick}
        >
          {isFavorite ? '♥' : '♡'} Favorite
        </Button>
      </div>
      
      <div className="recipe-actions__rating">
        <span className="recipe-actions__rating-label">Rate:</span>
        <StarRating
          rating={rating}
          onRatingChange={handleRatingChange}
          size="small"
        />
      </div>
    </div>
  );
}; 