import { render, screen } from '@testing-library/react';
import RecipeList, { type Recipe } from './RecipeList';

describe('RecipeList', () => {
  const sampleRecipes: Recipe[] = [
    {
      title: 'Pasta Salad',
      ingredients: ['pasta', 'tomato', 'olive oil'],
      steps: ['Boil pasta', 'Chop tomato', 'Mix all together'],
    },
    {
      title: 'Carrot Soup',
      ingredients: ['carrot', 'onion', 'water'],
      steps: ['Chop carrot', 'Boil with onion', 'Blend and serve'],
    },
  ];

  it('renders nothing if recipes is empty', () => {
    const { container } = render(<RecipeList recipes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders recipe titles and steps', () => {
    render(<RecipeList recipes={sampleRecipes} />);
    expect(screen.getByText('Pasta Salad')).toBeInTheDocument();
    expect(screen.getByText('Carrot Soup')).toBeInTheDocument();
    expect(screen.getByText('Boil pasta')).toBeInTheDocument();
    expect(screen.getByText('Blend and serve')).toBeInTheDocument();
  });
});
