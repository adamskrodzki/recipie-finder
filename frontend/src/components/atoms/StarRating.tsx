import './StarRating.css';

interface StarRatingProps {
  rating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = 'medium',
}) => {
  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className={`star-rating star-rating--${size}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= rating ? 'star--filled' : 'star--empty'} ${
            readonly ? 'star--readonly' : ''
          }`}
          onClick={() => handleStarClick(star)}
          disabled={readonly}
          aria-label={`Rate ${star} stars`}
        >
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}; 