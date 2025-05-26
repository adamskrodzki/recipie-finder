import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PantryItemForm } from './PantryItemForm';
import * as pantryService from '../../services/pantryService';
import type { PantryIngredientRow } from '../../services/pantryService';

// Mock the pantryService
jest.mock('../../services/pantryService', () => ({
  searchIngredientsByName: jest.fn(),
}));

const mockSuggestions: PantryIngredientRow[] = [
  { id: '1', name: 'Apples', created_at: new Date().toISOString() },
  { id: '2', name: 'Apricots', created_at: new Date().toISOString() },
];

describe('PantryItemForm', () => {
  let onSubmitMock: jest.MockedFunction<(data: unknown) => Promise<void>>;
  let onCancelMock: jest.MockedFunction<() => void>;

  beforeEach(() => {
    onSubmitMock = jest.fn();
    onCancelMock = jest.fn();
    (pantryService.searchIngredientsByName as jest.MockedFunction<typeof pantryService.searchIngredientsByName>).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = () => {
    return render(
      <PantryItemForm
        onSubmit={onSubmitMock}
        onCancel={onCancelMock}
      />
    );
  };

  it('renders form with all required fields', () => {
    renderForm();
    
    expect(screen.getByLabelText('Ingredient Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    renderForm();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    await userEvent.click(cancelButton);
    
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('submits form with correct data', async () => {
    renderForm();
    
    const nameInput = screen.getByLabelText('Ingredient Name');
    const submitButton = screen.getByRole('button', { name: 'Add' });
    
    await userEvent.type(nameInput, 'Apples');
    await userEvent.click(submitButton);
    
    expect(onSubmitMock).toHaveBeenCalledWith({
      name: 'Apples'
    });
  });

  it('disables submit button when name is empty', async () => {
    renderForm();
    
    const submitButton = screen.getByRole('button', { name: 'Add' });
    expect(submitButton).toBeDisabled();
  });

  it('allows short names and submits successfully', async () => {
    renderForm();
    
    const nameInput = screen.getByLabelText('Ingredient Name');
    const submitButton = screen.getByRole('button', { name: 'Add' });
    
    await userEvent.type(nameInput, 'A');
    await userEvent.click(submitButton);
    
    expect(onSubmitMock).toHaveBeenCalledWith({
      name: 'A'
    });
  });

  it('fetches suggestions when typing in name field', async () => {
    (pantryService.searchIngredientsByName as jest.Mock).mockResolvedValue(mockSuggestions);
    renderForm();
    
    const nameInput = screen.getByLabelText('Ingredient Name');
    await userEvent.type(nameInput, 'App');
    
    // Wait for debounce and API call
    await waitFor(() => {
      expect(pantryService.searchIngredientsByName).toHaveBeenCalledWith('App');
    }, { timeout: 1000 });
  });

  it('shows suggestions dropdown when available', async () => {
    (pantryService.searchIngredientsByName as jest.Mock).mockResolvedValue(mockSuggestions);
    renderForm();
    
    const nameInput = screen.getByLabelText('Ingredient Name');
    await userEvent.type(nameInput, 'App');
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Apricots')).toBeInTheDocument();
  });

  it('selects suggestion when clicked', async () => {
    (pantryService.searchIngredientsByName as jest.Mock).mockResolvedValue(mockSuggestions);
    renderForm();
    
    const nameInput = screen.getByLabelText('Ingredient Name');
    await userEvent.type(nameInput, 'App');
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    const appleOption = screen.getByText('Apples');
    await userEvent.click(appleOption);
    
    expect(nameInput).toHaveValue('Apples');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
}); 