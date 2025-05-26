import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PantryItem, CreatePantryItemRequest, UpdatePantryItemRequest } from '../../types/Pantry';
import { Button } from '../atoms/Button';
import { FormField } from './FormField';
import { DropdownList, type DropdownListItem } from '../atoms/DropdownList';
import { searchIngredientsByName, type PantryIngredientRow } from '../../services/pantryService';
import './PantryItemForm.css';

interface PantryItemFormProps {
  item?: PantryItem;
  onSubmit: (data: CreatePantryItemRequest | UpdatePantryItemRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const LISTBOX_ID = 'ingredient-suggestions-listbox';

export const PantryItemForm: React.FC<PantryItemFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({ name: item?.name || '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(item?.name || '');
  const [suggestions, setSuggestions] = useState<DropdownListItem[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [highlightedIndex, _setHighlightedIndex] = useState<number>(-1);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const setHighlightedIndex = (valueOrFn: number | ((prevIndex: number) => number)) => {
    _setHighlightedIndex(prevIndex => {
      const newValue = typeof valueOrFn === 'function' ? valueOrFn(prevIndex) : valueOrFn;
      return newValue;
    });
  };

  const assignSuggestionItemRef = (element: HTMLLIElement | null, index: number) => {
    suggestionItemRefs.current[index] = element;
  };

  useEffect(() => {
    suggestionItemRefs.current = suggestionItemRefs.current.slice(0, suggestions.length);
  }, [suggestions]);

  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < suggestionItemRefs.current.length) {
      const targetElement = suggestionItemRefs.current[highlightedIndex];
      targetElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSuggestionsLoading(true);
    setHighlightedIndex(-1);
    try {
      const results: PantryIngredientRow[] = await searchIngredientsByName(query);
      setSuggestions(results.map(r => ({ id: r.id, label: r.name })));
    } catch (err) {
      console.error('Failed to search ingredients:', err);
      setSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (item?.name) {
      setFormData({ name: item.name });
      setSearchQuery(item.name);
      setIsDropdownVisible(false);
    }
  }, [item]);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (isDropdownVisible && searchQuery === formData.name) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else if (!isDropdownVisible) {
      if (searchQuery.trim().length < 3) {
        setSuggestions([]);
      }
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchQuery, formData.name, fetchSuggestions, isDropdownVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isDropdownVisible && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      handleSuggestionSelect(suggestions[highlightedIndex]);
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Ingredient name is required');
      return;
    }
    setIsDropdownVisible(false);
    try {
      const submitData = { ...(item ? { id: item.id } : {}), name: formData.name.trim() };
      await onSubmit(submitData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({ name: newName });
    setSearchQuery(newName);
    setFormError(null);
    if (!isDropdownVisible && newName.trim().length > 0) {
      setIsDropdownVisible(true);
    }
    setHighlightedIndex(-1);
  };

  const handleSuggestionSelect = (selectedSuggestion: DropdownListItem) => {
    setFormData({ name: selectedSuggestion.label });
    setSearchQuery(selectedSuggestion.label);
    setIsDropdownVisible(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
    inputRef.current?.focus();
  };
  
  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0 ) {
      setIsDropdownVisible(true);
      if(searchQuery.trim().length >= 3 && suggestions.length === 0 && !isSuggestionsLoading) {
        fetchSuggestions(searchQuery);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && isDropdownVisible) {
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
        return;
    }
    if (!isDropdownVisible || (suggestions.length === 0 && !isSuggestionsLoading)) {
      if (e.key === 'Escape') {
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && highlightedIndex === -1) {
        // Allow form submission
      } else if (e.key !== 'Enter') {
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (suggestions.length > 0) {
          setHighlightedIndex(prev => (prev + 1) % suggestions.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (suggestions.length > 0) {
          setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        }
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[highlightedIndex]);
        } else {
          setIsDropdownVisible(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const isEdit = !!item;
  const formClass = `pantry-item-form ${className}`.trim();
  const currentDropdownItemId = highlightedIndex >=0 && suggestions[highlightedIndex] ? `dropdown-list__item--${suggestions[highlightedIndex].id}` : undefined;

  return (
    <form className={formClass} onSubmit={handleSubmit} ref={formRef}>
      <div className="pantry-item-form__header">
        <h3 className="pantry-item-form__title">
          {isEdit ? 'Edit Ingredient' : 'Add New Ingredient'}
        </h3>
      </div>

      {formError && (
        <div className="pantry-item-form__error">
          {formError}
        </div>
      )}

      <div className="pantry-item-form__fields">
        <div style={{ position: 'relative' }} 
             role="combobox" 
             aria-expanded={isDropdownVisible && suggestions.length > 0}
             aria-haspopup="listbox"
             aria-owns={LISTBOX_ID}
        >
          <FormField
            id="pantry-item-name"
            label="Ingredient Name"
            value={formData.name}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Chicken breast, Tomatoes"
            required
            disabled={isLoading}
            autoComplete="off"
            ref={inputRef}
            aria-autocomplete="list"
            aria-controls={LISTBOX_ID}
            aria-activedescendant={currentDropdownItemId}
          />
          {isDropdownVisible && (
            <DropdownList
              items={suggestions}
              onItemSelect={handleSuggestionSelect}
              isLoading={isSuggestionsLoading}
              className="pantry-item-form__dropdown"
              emptyMessage={
                isSuggestionsLoading ? "Loading..."
                : searchQuery.trim().length < 3 ? "Type at least 3 characters"
                : "No matching ingredients"
              }
              highlightedIndex={highlightedIndex}
              assignItemRef={assignSuggestionItemRef}
              listId={LISTBOX_ID}
            />
          )}
        </div>
      </div>

      <div className="pantry-item-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setIsDropdownVisible(false);
            onCancel();
          }}
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