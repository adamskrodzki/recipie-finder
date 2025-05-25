/* global jest */
import { render, screen, fireEvent } from '@testing-library/react';
import IngredientsInput from './IngredientsInput';

describe('IngredientsInput', () => {
  it('renders input and button', () => {
    render(<IngredientsInput onSubmit={() => {}} />);
    expect(screen.getByTestId('ingredients-input')).toBeInTheDocument();
    expect(screen.getByTestId('find-recipes-btn')).toBeInTheDocument();
  });

  it('calls onSubmit with parsed ingredients', () => {
    const handleSubmit = jest.fn();
    render(<IngredientsInput onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByTestId('ingredients-input'), {
      target: { value: 'carrot, pasta,  tomato ' },
    });
    fireEvent.click(screen.getByTestId('find-recipes-btn'));
    expect(handleSubmit).toHaveBeenCalledWith(['carrot', 'pasta', 'tomato']);
  });
});
