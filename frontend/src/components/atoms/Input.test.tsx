import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input value="" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('input');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with different types', () => {
    const { rerender } = render(<Input type="email" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" value="" onChange={() => {}} />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input value="test" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test');
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('shows placeholder text', () => {
    render(<Input value="" onChange={() => {}} placeholder="Enter text here" />);
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Input value="" onChange={() => {}} className="custom-input" />);
    expect(screen.getByRole('textbox')).toHaveClass('input', 'custom-input');
  });

  it('supports aria-label', () => {
    render(<Input value="" onChange={() => {}} aria-label="Custom label" />);
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
  });

  it('supports id attribute', () => {
    render(<Input id="test-input" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-input');
  });
}); 