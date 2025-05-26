import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientsInput } from './IngredientsInput';
import * as pantryService from '../../services/pantryService';
import type { PantryIngredientRow } from '../../services/pantryService';

// Mock pantryService
jest.mock('../../services/pantryService', () => ({
  searchIngredientsByName: jest.fn(),
}));

// Mock PantryIngredients component
jest.mock('../molecules/PantryIngredients', () => ({
  PantryIngredients: jest.fn(({ onIngredientClick }: { onIngredientClick: (ingredient: string) => void }) => (
    <div data-testid="pantry-ingredients">
      <button onClick={() => onIngredientClick('Tomatoes')}>Tomatoes</button>
      <button onClick={() => onIngredientClick('Onions')}>Onions</button>
    </div>
  )),
}));

const mockSuggestions: PantryIngredientRow[] = [
  { id: '1', name: 'Apples', created_at: new Date().toISOString() },
  { id: '2', name: 'Apricots', created_at: new Date().toISOString() },
];

describe('IngredientsInput', () => {
  let onSubmitMock: jest.MockedFunction<(ingredients: string[]) => void>;

  beforeEach(() => {
    onSubmitMock = jest.fn();
    (pantryService.searchIngredientsByName as jest.MockedFunction<typeof pantryService.searchIngredientsByName>).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (hasRecipes = false) => {
    return render(
      <IngredientsInput
        onSubmit={onSubmitMock}
        hasRecipes={hasRecipes}
      />
    );
  };

  it('renders with input field and submit button', () => {
    renderComponent();
    
    expect(screen.getByPlaceholderText('e.g., chicken, rice, tomatoes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find Recipes' })).toBeInTheDocument();
  });

  it('renders PantryIngredients component', () => {
    renderComponent();
    
    expect(screen.getByTestId('pantry-ingredients')).toBeInTheDocument();
  });

  it('submits ingredients when form is submitted', async () => {
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    const submitButton = screen.getByRole('button', { name: 'Find Recipes' });
    
    await userEvent.type(input, 'tomatoes, onions, garlic');
    await userEvent.click(submitButton);
    
    expect(onSubmitMock).toHaveBeenCalledWith(['tomatoes', 'onions', 'garlic']);
  });

  it('trims whitespace from ingredients', async () => {
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    const submitButton = screen.getByRole('button', { name: 'Find Recipes' });
    
    await userEvent.type(input, ' tomatoes , onions , garlic ');
    await userEvent.click(submitButton);
    
    expect(onSubmitMock).toHaveBeenCalledWith(['tomatoes', 'onions', 'garlic']);
  });

  it('filters out empty ingredients', async () => {
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    const submitButton = screen.getByRole('button', { name: 'Find Recipes' });
    
    await userEvent.type(input, 'tomatoes,, onions,   , garlic');
    await userEvent.click(submitButton);
    
    expect(onSubmitMock).toHaveBeenCalledWith(['tomatoes', 'onions', 'garlic']);
  });

  it('adds ingredient from pantry when clicked', async () => {
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    const tomatoButton = screen.getByText('Tomatoes');
    
    await userEvent.click(tomatoButton);
    
    expect(input).toHaveValue('Tomatoes, ');
  });

  it('appends ingredient to existing input with proper comma spacing', async () => {
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    
    await userEvent.type(input, 'existing ingredient');
    
    const tomatoButton = screen.getByText('Tomatoes');
    await userEvent.click(tomatoButton);
    
    expect(input).toHaveValue('existing ingredient, Tomatoes, ');
  });

  it('fetches suggestions when typing', async () => {
    (pantryService.searchIngredientsByName as jest.Mock).mockResolvedValue(mockSuggestions);
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    
    await act(async () => {
      await userEvent.type(input, 'ap');
    });
    
    // Wait for debounce and API call
    await waitFor(() => {
      expect(pantryService.searchIngredientsByName).toHaveBeenCalledWith('ap');
    }, { timeout: 1000 });
  });

  it('shows suggestions dropdown when available', async () => {
    (pantryService.searchIngredientsByName as jest.Mock).mockResolvedValue(mockSuggestions);
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    
    await act(async () => {
      await userEvent.type(input, 'ap');
    });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Apricots')).toBeInTheDocument();
  });

  it('selects suggestion when clicked', async () => {
    (pantryService.searchIngredientsByName as jest.Mock).mockResolvedValue(mockSuggestions);
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g., chicken, rice, tomatoes');
    
    await act(async () => {
      await userEvent.type(input, 'ap');
    });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    const appleOption = screen.getByText('Apples');
    await userEvent.click(appleOption);
    
    expect(input).toHaveValue('Apples');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows collapse button when hasRecipes is true', () => {
    renderComponent(true);
    
    expect(screen.getByRole('button', { name: 'Collapse ingredients input' })).toBeInTheDocument();
  });

  it('does not show collapse button when hasRecipes is false', () => {
    renderComponent(false);
    
    expect(screen.queryByRole('button', { name: 'Collapse ingredients input' })).not.toBeInTheDocument();
  });
}); 