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

  it('renders recipes when provided', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    expect(screen.getByText('Suggested Recipes')).toBeInTheDocument();
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('renders correct number of recipe cards', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const recipeCards = screen.getAllByText(/Ingredients/);
    expect(recipeCards).toHaveLength(2);
  });

  it('handles refine action', () => {
    const handleRefine = jest.fn();
    render(<RecipeList recipes={mockRecipes} onRefine={handleRefine} />);
    
    const refineButtons = screen.getAllByText('Refine Recipe');
    fireEvent.click(refineButtons[0]);
    
    expect(handleRefine).toHaveBeenCalledWith('1');
  });

  it('handles favorite action', () => {
    const handleFavorite = jest.fn();
    render(<RecipeList recipes={mockRecipes} onFavorite={handleFavorite} />);
    
    const favoriteButtons = screen.getAllByText(/Favorite/);
    fireEvent.click(favoriteButtons[0]);
    
    expect(handleFavorite).toHaveBeenCalledWith('1');
  });

  it('handles rating change', () => {
    const handleRatingChange = jest.fn();
    render(<RecipeList recipes={mockRecipes} onRatingChange={handleRatingChange} />);
    
    // Get all star buttons and click the first 5-star rating (from first recipe)
    const allStars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    // Click the 5th star of the first recipe (first 5 stars belong to first recipe)
    fireEvent.click(allStars[4]);
    
    expect(handleRatingChange).toHaveBeenCalledWith('1', 5);
  });

  it('displays recipes in grid layout', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const grid = screen.getByText('Chicken Stir Fry').closest('.recipe-list__grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('recipe-list__grid');
  });

  it('shows title when recipes are present', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const title = screen.getByText('Suggested Recipes');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('recipe-list__title');
  });

  it('renders within container with proper styling', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const container = screen.getByText('Suggested Recipes').closest('.recipe-list-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('recipe-list-container');
  });

  it('passes all props to recipe cards correctly', () => {
    const handleRefine = jest.fn();
    const handleFavorite = jest.fn();
    const handleRatingChange = jest.fn();
    
    render(
      <RecipeList 
        recipes={mockRecipes}
        onRefine={handleRefine}
        onFavorite={handleFavorite}
        onRatingChange={handleRatingChange}
      />
    );
    
    // Verify that all recipe information is displayed
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    
    // Verify that actions work
    const refineButtons = screen.getAllByText('Refine Recipe');
    fireEvent.click(refineButtons[1]); // Click second recipe's refine button
    expect(handleRefine).toHaveBeenCalledWith('2');
  });

  it('shows loading spinner with proper accessibility', () => {
    render(<RecipeList recipes={[]} isLoading />);
    
    const spinner = screen.getByRole('status', { name: /loading recipes/i });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('recipe-list__spinner');
  });

  it('handles single recipe correctly', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    expect(screen.getByText('Suggested Recipes')).toBeInTheDocument();
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });
}); 