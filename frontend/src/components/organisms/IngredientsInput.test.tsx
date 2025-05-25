import { render, screen, fireEvent } from '@testing-library/react';
import { IngredientsInput } from './IngredientsInput';

describe('IngredientsInput', () => {
  it('renders with default state', () => {
    render(<IngredientsInput onSubmit={() => {}} />);
    
    expect(screen.getByLabelText(/enter your available ingredients/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/chicken, rice, tomatoes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find recipes/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<IngredientsInput onSubmit={() => {}} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    fireEvent.change(input, { target: { value: 'chicken, rice' } });
    
    expect(input).toHaveValue('chicken, rice');
  });

  it('submits ingredients when form is submitted', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const submitButton = screen.getByRole('button', { name: /find recipes/i });
    
    fireEvent.change(input, { target: { value: 'chicken, rice, tomatoes' } });
    fireEvent.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalledWith(['chicken', 'rice', 'tomatoes']);
  });

  it('trims whitespace from ingredients', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    fireEvent.change(input, { target: { value: ' chicken , rice  , tomatoes ' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(handleSubmit).toHaveBeenCalledWith(['chicken', 'rice', 'tomatoes']);
  });

  it('filters out empty ingredients', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    fireEvent.change(input, { target: { value: 'chicken,, rice,  , tomatoes' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(handleSubmit).toHaveBeenCalledWith(['chicken', 'rice', 'tomatoes']);
  });

  it('does not submit when input is empty', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /find recipes/i });
    fireEvent.click(submitButton);
    
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when input contains only whitespace', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<IngredientsInput onSubmit={() => {}} isLoading />);
    
    expect(screen.getByRole('button', { name: /finding recipes/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/enter your available ingredients/i)).toBeDisabled();
  });

  it('disables submit button when loading', () => {
    render(<IngredientsInput onSubmit={() => {}} isLoading />);
    
    const submitButton = screen.getByRole('button', { name: /finding recipes/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when input is empty', () => {
    render(<IngredientsInput onSubmit={() => {}} />);
    
    const submitButton = screen.getByRole('button', { name: /find recipes/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has content', () => {
    render(<IngredientsInput onSubmit={() => {}} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const submitButton = screen.getByRole('button', { name: /find recipes/i });
    
    fireEvent.change(input, { target: { value: 'chicken' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('handles form submission via Enter key', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    fireEvent.change(input, { target: { value: 'chicken, rice' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(handleSubmit).toHaveBeenCalledWith(['chicken', 'rice']);
  });

  it('renders within a card component', () => {
    render(<IngredientsInput onSubmit={() => {}} />);
    
    const input = screen.getByLabelText(/enter your available ingredients/i);
    const card = input.closest('.card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('ingredients-input');
  });
}); 