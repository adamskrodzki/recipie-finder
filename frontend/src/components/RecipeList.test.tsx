import { render, screen } from '@testing-library/react';
import { RecipeList } from './RecipeList';
import type { Recipe } from '../types/Recipe';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Chicken Stir Fry',
    ingredients: ['chicken', 'rice', 'soy sauce', 'vegetables'],
    steps: [
      'Heat oil in a pan',
      'Add chicken and cook until done',
      'Add vegetables and stir fry',
      'Serve over rice'
    ]
  },
  {
    id: '2',
    title: 'Vegetable Soup',
    ingredients: ['vegetables', 'broth', 'herbs', 'salt'],
    steps: [
      'Chop vegetables',
      'Boil broth in a pot',
      'Add vegetables and simmer',
      'Season with herbs and salt'
    ]
  }
];

describe('RecipeList', () => {
  test('renders nothing when recipes array is empty', () => {
    const { container } = render(<RecipeList recipes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders loading state when isLoading is true', () => {
    render(<RecipeList recipes={[]} isLoading={true} />);
    
    expect(screen.getByText(/finding delicious recipes for you/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // loading spinner
  });

  test('renders recipe list with titles and steps', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    // Check for section title
    expect(screen.getByText('Suggested Recipes')).toBeInTheDocument();
    
    // Check for recipe titles
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    expect(screen.getByText('Vegetable Soup')).toBeInTheDocument();
    
    // Check for ingredients sections
    expect(screen.getAllByText('Ingredients')).toHaveLength(2);
    expect(screen.getAllByText('Instructions')).toHaveLength(2);
    
    // Check for specific ingredients
    expect(screen.getByText('chicken')).toBeInTheDocument();
    expect(screen.getByText('vegetables')).toBeInTheDocument();
    
    // Check for specific steps
    expect(screen.getByText('Heat oil in a pan')).toBeInTheDocument();
    expect(screen.getByText('Chop vegetables')).toBeInTheDocument();
  });

  test('renders action buttons for each recipe', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    // Check for refine buttons
    const refineButtons = screen.getAllByText('Refine Recipe');
    expect(refineButtons).toHaveLength(2);
    
    // Check for favorite buttons
    const favoriteButtons = screen.getAllByText('♡ Favorite');
    expect(favoriteButtons).toHaveLength(2);
    
    // Check for rating sections
    const ratingLabels = screen.getAllByText('Rate:');
    expect(ratingLabels).toHaveLength(2);
    
    // Check for star buttons (5 stars per recipe * 2 recipes = 10 stars)
    const starButtons = screen.getAllByLabelText(/rate \d stars/i);
    expect(starButtons).toHaveLength(10);
  });

  test('renders ingredients as list items', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    const ingredientsList = screen.getByRole('list');
    expect(ingredientsList).toBeInTheDocument();
    
    // Check that all ingredients are rendered
    mockRecipes[0].ingredients.forEach(ingredient => {
      expect(screen.getByText(ingredient)).toBeInTheDocument();
    });
  });

  test('renders steps as ordered list items', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    // Check that all steps are rendered
    mockRecipes[0].steps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  test('renders correct number of recipe cards', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    // Each recipe should have a card with a title
    const recipeTitles = mockRecipes.map(recipe => recipe.title);
    recipeTitles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
}); 