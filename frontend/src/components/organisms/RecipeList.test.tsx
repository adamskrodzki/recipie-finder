import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeList } from './RecipeList';
import type { Recipe } from '../../types/Recipe';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Chicken Stir Fry',
    ingredients: ['chicken', 'rice', 'vegetables'],
    steps: ['Heat oil', 'Add chicken', 'Stir fry'],
    rating: 4,
    isFavorite: false,
  },
  {
    id: '2',
    title: 'Pasta Carbonara',
    ingredients: ['pasta', 'eggs', 'bacon'],
    steps: ['Boil pasta', 'Cook bacon', 'Mix with eggs'],
    rating: 5,
    isFavorite: true,
  },
  {
    id: '3',
    title: 'Vegetable Soup',
    ingredients: ['vegetables', 'broth', 'herbs'],
    steps: ['Chop vegetables', 'Simmer in broth', 'Season'],
    rating: 3,
    isFavorite: false,
  },
];

describe('RecipeList', () => {
  it('renders nothing when no recipes and not loading', () => {
    const { container } = render(<RecipeList recipes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state', () => {
    render(<RecipeList recipes={[]} isLoading />);
    
    expect(screen.getByText('Finding delicious recipes for you...')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /loading recipes/i })).toBeInTheDocument();
  });

  it('renders first recipe by default in carousel', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    expect(screen.getByText('Suggested Recipes')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('shows navigation arrows when multiple recipes', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    expect(screen.getByRole('button', { name: /previous recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next recipe/i })).toBeInTheDocument();
  });

  it('does not show navigation arrows for single recipe', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    expect(screen.queryByRole('button', { name: /previous recipe/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next recipe/i })).not.toBeInTheDocument();
  });

  it('shows indicators when multiple recipes', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const indicators = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Go to recipe')
    );
    expect(indicators).toHaveLength(3);
  });

  it('does not show indicators for single recipe', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    const indicators = screen.queryAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Go to recipe')
    );
    expect(indicators).toHaveLength(0);
  });

  it('navigates to next recipe when next button clicked', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const nextButton = screen.getByRole('button', { name: /next recipe/i });
    fireEvent.click(nextButton);
    
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.queryByText('Chicken Stir Fry')).not.toBeInTheDocument();
  });

  it('navigates to previous recipe when previous button clicked', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    // First go to next recipe
    const nextButton = screen.getByRole('button', { name: /next recipe/i });
    fireEvent.click(nextButton);
    
    // Then go back to previous
    const prevButton = screen.getByRole('button', { name: /previous recipe/i });
    fireEvent.click(prevButton);
    
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
  });

  it('wraps around when navigating past last recipe', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const nextButton = screen.getByRole('button', { name: /next recipe/i });
    
    // Click next twice to get to last recipe
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    
    // Click next again to wrap to first
    fireEvent.click(nextButton);
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
  });

  it('wraps around when navigating before first recipe', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const prevButton = screen.getByRole('button', { name: /previous recipe/i });
    fireEvent.click(prevButton);
    
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Vegetable Soup')).toBeInTheDocument();
  });

  it('navigates to specific recipe when indicator clicked', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const indicators = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Go to recipe')
    );
    
    fireEvent.click(indicators[2]); // Click third indicator
    
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Vegetable Soup')).toBeInTheDocument();
  });

  it('handles refine action for current recipe', () => {
    const handleRefine = jest.fn();
    render(<RecipeList recipes={mockRecipes} onRefine={handleRefine} />);
    
    const refineButton = screen.getByText('Refine Recipe');
    fireEvent.click(refineButton);
    
    expect(handleRefine).toHaveBeenCalledWith('1');
  });

  it('handles favorite action for current recipe', () => {
    const handleFavorite = jest.fn();
    render(<RecipeList recipes={mockRecipes} onFavorite={handleFavorite} />);
    
    const favoriteButton = screen.getByText(/Favorite/);
    fireEvent.click(favoriteButton);
    
    expect(handleFavorite).toHaveBeenCalledWith('1');
  });

  it('handles rating change for current recipe', () => {
    const handleRatingChange = jest.fn();
    render(<RecipeList recipes={mockRecipes} onRatingChange={handleRatingChange} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    fireEvent.click(stars[4]); // Click 5th star
    
    expect(handleRatingChange).toHaveBeenCalledWith('1', 5);
  });

  it('shows correct counter for single recipe', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
  });

  it('renders within container with proper styling', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const container = screen.getByText('Suggested Recipes').closest('.recipe-list-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('recipe-list-container');
  });

  it('shows loading spinner with proper accessibility', () => {
    render(<RecipeList recipes={[]} isLoading />);
    
    const spinner = screen.getByRole('status', { name: /loading recipes/i });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('recipe-list__spinner');
  });

  it('maintains recipe state when navigating', () => {
    const handleRatingChange = jest.fn();
    render(<RecipeList recipes={mockRecipes} onRatingChange={handleRatingChange} />);
    
    // Rate first recipe
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    fireEvent.click(stars[2]); // Click 3rd star
    
    // Navigate to next recipe and back
    const nextButton = screen.getByRole('button', { name: /next recipe/i });
    fireEvent.click(nextButton);
    
    const prevButton = screen.getByRole('button', { name: /previous recipe/i });
    fireEvent.click(prevButton);
    
    // Verify we're back to first recipe
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(handleRatingChange).toHaveBeenCalledWith('1', 3);
  });
}); 