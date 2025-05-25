import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders with default props', () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('card');
  });

  it('applies hover class when specified', () => {
    render(<Card hover>Hoverable card</Card>);
    const card = screen.getByText('Hoverable card');
    expect(card).toHaveClass('card', 'card--hover');
  });

  it('applies custom className', () => {
    render(<Card className="custom-card">Custom card</Card>);
    const card = screen.getByText('Custom card');
    expect(card).toHaveClass('card', 'custom-card');
  });

  it('renders children correctly', () => {
    render(
      <Card>
        <div>Child 1</div>
        <div>Child 2</div>
      </Card>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders with correct class', () => {
    render(<CardHeader>Header content</CardHeader>);
    const header = screen.getByText('Header content');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('card__header');
  });

  it('applies custom className', () => {
    render(<CardHeader className="custom-header">Custom header</CardHeader>);
    const header = screen.getByText('Custom header');
    expect(header).toHaveClass('card__header', 'custom-header');
  });
});

describe('CardContent', () => {
  it('renders with correct class', () => {
    render(<CardContent>Content here</CardContent>);
    const content = screen.getByText('Content here');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('card__content');
  });

  it('applies custom className', () => {
    render(<CardContent className="custom-content">Custom content</CardContent>);
    const content = screen.getByText('Custom content');
    expect(content).toHaveClass('card__content', 'custom-content');
  });
});

describe('CardFooter', () => {
  it('renders with correct class', () => {
    render(<CardFooter>Footer content</CardFooter>);
    const footer = screen.getByText('Footer content');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('card__footer');
  });

  it('applies custom className', () => {
    render(<CardFooter className="custom-footer">Custom footer</CardFooter>);
    const footer = screen.getByText('Custom footer');
    expect(footer).toHaveClass('card__footer', 'custom-footer');
  });
});

describe('Card composition', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>Recipe Title</CardHeader>
        <CardContent>Recipe details</CardContent>
        <CardFooter>Recipe actions</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Recipe Title')).toBeInTheDocument();
    expect(screen.getByText('Recipe details')).toBeInTheDocument();
    expect(screen.getByText('Recipe actions')).toBeInTheDocument();
  });
}); 