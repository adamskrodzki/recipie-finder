import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the ingredient input form', () => {
    render(<App />);
    
    // Check if the main heading is present
    expect(screen.getByText('AI-Assisted Recipe Finder')).toBeInTheDocument();
    
    // Check if the ingredient input field is present
    expect(screen.getByLabelText(/enter your available ingredients/i)).toBeInTheDocument();
    
    // Check if the input has the correct placeholder
    expect(screen.getByPlaceholderText(/chicken, rice, tomatoes, onions/i)).toBeInTheDocument();
    
    // Check if the submit button is present
    expect(screen.getByRole('button', { name: /find recipes/i })).toBeInTheDocument();
  });

  it('renders the form with correct structure', () => {
    render(<App />);
    
    // Check if the form element exists within the ingredients input component
    const ingredientInput = screen.getByLabelText(/enter your available ingredients/i);
    const form = ingredientInput.closest('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('ingredients-input__form');
    
    // Check if the input field is of type text
    expect(ingredientInput).toHaveAttribute('type', 'text');
    expect(ingredientInput).toHaveAttribute('id', 'ingredients');
  });

  it('renders the header section', () => {
    render(<App />);
    
    // Check if the description text is present
    expect(screen.getByText('Find delicious recipes based on your available ingredients')).toBeInTheDocument();
  });
}); 