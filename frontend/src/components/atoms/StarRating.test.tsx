import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders with default props', () => {
    render(<StarRating />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
    expect(stars[0]).toHaveTextContent('☆');
  });

  it('displays filled stars based on rating', () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByRole('button');
    
    expect(stars[0]).toHaveTextContent('★');
    expect(stars[1]).toHaveTextContent('★');
    expect(stars[2]).toHaveTextContent('★');
    expect(stars[3]).toHaveTextContent('☆');
    expect(stars[4]).toHaveTextContent('☆');
  });

  it('handles rating changes when interactive', () => {
    const handleRatingChange = jest.fn();
    render(<StarRating onRatingChange={handleRatingChange} />);
    
    const thirdStar = screen.getAllByRole('button')[2];
    fireEvent.click(thirdStar);
    
    expect(handleRatingChange).toHaveBeenCalledWith(3);
  });

  it('does not handle clicks when readonly', () => {
    const handleRatingChange = jest.fn();
    render(<StarRating readonly onRatingChange={handleRatingChange} />);
    
    const stars = screen.getAllByRole('button');
    expect(stars[0]).toBeDisabled();
    
    fireEvent.click(stars[0]);
    expect(handleRatingChange).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<StarRating size="small" />);
    expect(screen.getAllByRole('button')[0].parentElement).toHaveClass('star-rating--small');

    rerender(<StarRating size="large" />);
    expect(screen.getAllByRole('button')[0].parentElement).toHaveClass('star-rating--large');
  });

  it('applies readonly class when readonly', () => {
    render(<StarRating readonly />);
    const stars = screen.getAllByRole('button');
    stars.forEach(star => {
      expect(star).toHaveClass('star--readonly');
    });
  });

  it('has proper aria labels', () => {
    render(<StarRating />);
    const stars = screen.getAllByRole('button');
    
    expect(stars[0]).toHaveAttribute('aria-label', 'Rate 1 stars');
    expect(stars[4]).toHaveAttribute('aria-label', 'Rate 5 stars');
  });
}); 