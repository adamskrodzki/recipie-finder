import { render, screen } from '@testing-library/react';
import { List, IngredientsList, StepsList } from './List';

describe('List', () => {
  const mockItems = ['Item 1', 'Item 2', 'Item 3'];

  it('renders unordered list by default', () => {
    render(<List items={mockItems} />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveClass('list', 'list--unordered');
  });

  it('renders ordered list when specified', () => {
    render(<List items={mockItems} ordered />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('list', 'list--ordered');
  });

  it('renders all items', () => {
    render(<List items={mockItems} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toHaveTextContent('Item 1');
    expect(listItems[1]).toHaveTextContent('Item 2');
    expect(listItems[2]).toHaveTextContent('Item 3');
  });

  it('applies custom className', () => {
    render(<List items={mockItems} className="custom-list" />);
    expect(screen.getByRole('list')).toHaveClass('custom-list');
  });

  it('handles empty items array', () => {
    render(<List items={[]} />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('IngredientsList', () => {
  const ingredients = ['Chicken', 'Rice', 'Tomatoes'];

  it('renders as unordered list with ingredients styling', () => {
    render(<IngredientsList items={ingredients} />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveClass('list--ingredients');
  });

  it('renders all ingredients', () => {
    render(<IngredientsList items={ingredients} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toHaveTextContent('Chicken');
    expect(listItems[1]).toHaveTextContent('Rice');
    expect(listItems[2]).toHaveTextContent('Tomatoes');
  });
});

describe('StepsList', () => {
  const steps = ['Heat oil in pan', 'Add chicken', 'Cook for 5 minutes'];

  it('renders as ordered list with steps styling', () => {
    render(<StepsList items={steps} />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('list--steps');
  });

  it('renders all steps', () => {
    render(<StepsList items={steps} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toHaveTextContent('Heat oil in pan');
    expect(listItems[1]).toHaveTextContent('Add chicken');
    expect(listItems[2]).toHaveTextContent('Cook for 5 minutes');
  });
}); 