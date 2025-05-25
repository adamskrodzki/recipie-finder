import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '../../types/Recipe';

const mockRecipe: Recipe = {
  id: '1',
  title: 'Chicken Stir Fry',
  ingredients: ['chicken', 'rice', 'vegetables'],
  steps: ['Heat oil', 'Add chicken', 'Stir fry'],
  rating: 4,
  isFavorite: false,
};

describe('RecipeCard', () => {
  it('renders recipe information correctly', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    
    // Check ingredients
    expect(screen.getByText('chicken')).toBeInTheDocument();
    expect(screen.getByText('rice')).toBeInTheDocument();
    expect(screen.getByText('vegetables')).toBeInTheDocument();
    
    // Check steps
    expect(screen.getByText('Heat oil')).toBeInTheDocument();
    expect(screen.getByText('Add chicken')).toBeInTheDocument();
    expect(screen.getByText('Stir fry')).toBeInTheDocument();
  });

  it('displays rating correctly', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    // First 4 stars should be filled (rating is 4)
    expect(stars[0]).toHaveTextContent('★');
    expect(stars[1]).toHaveTextContent('★');
    expect(stars[2]).toHaveTextContent('★');
    expect(stars[3]).toHaveTextContent('★');
    expect(stars[4]).toHaveTextContent('☆');
  });

  it('shows favorite status correctly', () => {
    const favoriteRecipe = { ...mockRecipe, isFavorite: true };
    render(<RecipeCard recipe={favoriteRecipe} />);
    
    expect(screen.getByText('♥ Favorite')).toBeInTheDocument();
  });

  it('handles refine button click', () => {
    const handleRefine = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onRefine={handleRefine} />);
    
    fireEvent.click(screen.getByText('Refine Recipe'));
    expect(handleRefine).toHaveBeenCalledWith('1');
  });

  it('handles favorite button click', () => {
    const handleFavorite = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onFavorite={handleFavorite} />);
    
    fireEvent.click(screen.getByText('♡ Favorite'));
    expect(handleFavorite).toHaveBeenCalledWith('1');
  });

  it('handles rating change', () => {
    const handleRatingChange = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onRatingChange={handleRatingChange} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    fireEvent.click(stars[4]); // Click 5th star
    expect(handleRatingChange).toHaveBeenCalledWith('1', 5);
  });

  it('renders with hover effect', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    const card = screen.getByText('Chicken Stir Fry').closest('.card');
    expect(card).toHaveClass('card--hover');
  });

  it('handles recipe with no rating', () => {
    const recipeWithoutRating = { ...mockRecipe, rating: undefined };
    render(<RecipeCard recipe={recipeWithoutRating} />);
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Rate')
    );
    
    // All stars should be empty
    stars.forEach(star => {
      expect(star).toHaveTextContent('☆');
    });
  });

  it('renders ingredients as unordered list', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    const ingredientsList = screen.getByText('chicken').closest('ul');
    expect(ingredientsList).toBeInTheDocument();
    expect(ingredientsList).toHaveClass('list--ingredients');
  });

  it('renders steps as ordered list', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    const stepsList = screen.getByText('Heat oil').closest('ol');
    expect(stepsList).toBeInTheDocument();
    expect(stepsList).toHaveClass('list--steps');
  });
}); 