import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders with required props', () => {
    render(
      <FormField
        id="test-field"
        label="Test Label"
        value=""
        onChange={() => {}}
      />
    );
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-field');
  });

  it('shows required indicator when required', () => {
    render(
      <FormField
        id="test-field"
        label="Required Field"
        value=""
        onChange={() => {}}
        required
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    const handleChange = jest.fn();
    render(
      <FormField
        id="test-field"
        label="Test Field"
        value="initial"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('supports different input types', () => {
    render(
      <FormField
        id="email-field"
        label="Email"
        value=""
        onChange={() => {}}
        type="email"
      />
    );
    
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('shows placeholder text', () => {
    render(
      <FormField
        id="test-field"
        label="Test Field"
        value=""
        onChange={() => {}}
        placeholder="Enter text here"
      />
    );
    
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(
      <FormField
        id="test-field"
        label="Disabled Field"
        value=""
        onChange={() => {}}
        disabled
      />
    );
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('associates label with input correctly', () => {
    render(
      <FormField
        id="associated-field"
        label="Associated Label"
        value=""
        onChange={() => {}}
      />
    );
    
    const label = screen.getByText('Associated Label');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'associated-field');
    expect(input).toHaveAttribute('id', 'associated-field');
  });
}); 