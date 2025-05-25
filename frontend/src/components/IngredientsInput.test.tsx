import { render, screen, fireEvent } from '@testing-library/react';
import { IngredientsInput } from './IngredientsInput';

describe('IngredientsInput', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders input field and submit button', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/enter your available ingredients/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., chicken, rice, tomatoes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find recipes/i })).toBeInTheDocument();
  });

  test('calls onSubmit with parsed ingredients when form is submitted', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const submitButton = screen.getByRole('button', { name: /find recipes/i });

    fireEvent.change(input, { target: { value: 'chicken, rice, tomatoes, onions' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(['chicken', 'rice', 'tomatoes', 'onions']);
  });

  test('trims whitespace from ingredients', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const submitButton = screen.getByRole('button', { name: /find recipes/i });

    fireEvent.change(input, { target: { value: ' chicken , rice,  tomatoes , onions ' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(['chicken', 'rice', 'tomatoes', 'onions']);
  });

  test('does not call onSubmit when input is empty', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /find recipes/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('disables input and button when loading', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const submitButton = screen.getByRole('button', { name: /finding recipes/i });

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  test('shows loading text on button when loading', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    expect(screen.getByRole('button', { name: /finding recipes/i })).toBeInTheDocument();
  });

  test('filters out empty ingredients', () => {
    render(<IngredientsInput onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const submitButton = screen.getByRole('button', { name: /find recipes/i });

    fireEvent.change(input, { target: { value: 'chicken, , rice, , tomatoes' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(['chicken', 'rice', 'tomatoes']);
  });
}); 