import React, { useState } from 'react';
import type { PantryItem, CreatePantryItemRequest, UpdatePantryItemRequest } from '../../types/Pantry';
import { Button } from '../atoms/Button';
import { FormField } from './FormField';
import './PantryItemForm.css';

interface PantryItemFormProps {
  item?: PantryItem;
  onSubmit: (data: CreatePantryItemRequest | UpdatePantryItemRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export const PantryItemForm: React.FC<PantryItemFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    expiresAt: item?.expiresAt ? item.expiresAt.toISOString().split('T')[0] : '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Ingredient name is required');
      return;
    }

    try {
      const submitData = {
        ...(item ? { id: item.id } : {}),
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      };

      await onSubmit(submitData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setError(errorMessage);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const isEdit = !!item;
  const formClass = `pantry-item-form ${className}`.trim();

  return (
    <form className={formClass} onSubmit={handleSubmit}>
      <div className="pantry-item-form__header">
        <h3 className="pantry-item-form__title">
          {isEdit ? 'Edit Ingredient' : 'Add New Ingredient'}
        </h3>
      </div>

      {error && (
        <div className="pantry-item-form__error">
          {error}
        </div>
      )}

      <div className="pantry-item-form__fields">
        <FormField
          id="pantry-item-name"
          label="Ingredient Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          placeholder="e.g., Chicken breast, Tomatoes"
          required
          disabled={isLoading}
        />

        <FormField
          id="pantry-item-category"
          label="Category (Optional)"
          value={formData.category}
          onChange={handleInputChange('category')}
          placeholder="e.g., Protein, Vegetable, Dairy"
          disabled={isLoading}
        />

        <div className="form-field">
          <label htmlFor="pantry-item-expires" className="form-field__label">
            Expiration Date (Optional)
          </label>
          <input
            id="pantry-item-expires"
            type="date"
            value={formData.expiresAt}
            onChange={handleInputChange('expiresAt')}
            disabled={isLoading}
            className="form-field__input"
          />
        </div>
      </div>

      <div className="pantry-item-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  );
}; 