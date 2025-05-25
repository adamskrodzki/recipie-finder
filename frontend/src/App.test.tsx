import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the AI-Assisted Recipe Finder heading', () => {
    render(<App />);
    expect(screen.getByText(/AI-Assisted Recipe Finder/i)).toBeInTheDocument();
  });

  it('renders the Find Recipes button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /find recipes/i })).toBeInTheDocument();
  });
});
