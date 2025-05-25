import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeActions } from './RecipeActions';

describe('RecipeActions', () => {
  it('renders with default props', () => {
    render(<RecipeActions />);
    
    expect(screen.getByText('Refine Recipe')).toBeInTheDocument();
    expect(screen.getByText('♡ Favorite')).toBeInTheDocument();
    expect(screen.getByText('Rate:')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(7); // 2 action buttons + 5 star buttons
  });

  it('handles refine button click', () => {
    const handleRefine = jest.fn();
    render(<RecipeActions onRefine={handleRefine} />);
    
    fireEvent.click(screen.getByText('Refine Recipe'));
    expect(handleRefine).toHaveBeenCalledTimes(1);
  });

  it('handles favorite button click', () => {
    const handleFavorite = jest.fn();
    render(<RecipeActions onFavorite={handleFavorite} />);
    
    fireEvent.click(screen.getByText('♡ Favorite'));
    expect(handleFavorite).toHaveBeenCalledTimes(1);
  });

  it('shows filled heart when favorited', () => {
    render(<RecipeActions isFavorite />);
    expect(screen.getByText('♥ Favorite')).toBeInTheDocument();
  });

  it('shows empty heart when not favorited', () => {
    render(<RecipeActions isFavorite={false} />);
    expect(screen.getByText('♡ Favorite')).toBeInTheDocument();
  });

  it('handles rating changes', () => {
    const handleRatingChange = jest.fn();
    render(<RecipeActions onRatingChange={handleRatingChange} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    fireEvent.click(stars[2]); // Click 3rd star
    expect(handleRatingChange).toHaveBeenCalledWith(3);
  });

  it('displays current rating', () => {
    render(<RecipeActions rating={4} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    // First 4 stars should be filled
    expect(stars[0]).toHaveTextContent('★');
    expect(stars[1]).toHaveTextContent('★');
    expect(stars[2]).toHaveTextContent('★');
    expect(stars[3]).toHaveTextContent('★');
    expect(stars[4]).toHaveTextContent('☆');
  });

  it('renders all components together', () => {
    const handleRefine = jest.fn();
    const handleFavorite = jest.fn();
    const handleRatingChange = jest.fn();
    
    render(
      <RecipeActions
        onRefine={handleRefine}
        onFavorite={handleFavorite}
        onRatingChange={handleRatingChange}
        rating={3}
        isFavorite
      />
    );
    
    expect(screen.getByText('Refine Recipe')).toBeInTheDocument();
    expect(screen.getByText('♥ Favorite')).toBeInTheDocument();
    expect(screen.getByText('Rate:')).toBeInTheDocument();
    
    // Test all interactions work
    fireEvent.click(screen.getByText('Refine Recipe'));
    expect(handleRefine).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('♥ Favorite'));
    expect(handleFavorite).toHaveBeenCalled();
  });
}); 