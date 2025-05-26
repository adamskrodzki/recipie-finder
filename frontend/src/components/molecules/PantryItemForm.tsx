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
      console.log('[PantryItemForm] setHighlightedIndex:', { prevIndex, newValue });
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
    console.log('[PantryItemForm] highlightedIndex EFFECT: current highlightedIndex is', highlightedIndex);
    if (highlightedIndex >= 0 && highlightedIndex < suggestionItemRefs.current.length) {
      const targetElement = suggestionItemRefs.current[highlightedIndex];
      console.log('[PantryItemForm] highlightedIndex EFFECT: Scrolling to element:', targetElement, 'at index', highlightedIndex);
      targetElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    } else {
      console.log('[PantryItemForm] highlightedIndex EFFECT: No scroll, index out of bounds or element not found.');
    }
  }, [highlightedIndex]);

  const fetchSuggestions = useCallback(async (query: string) => {
    console.log('[PantryItemForm] fetchSuggestions: Called with query -', query);
    if (query.trim().length < 3) {
      console.log('[PantryItemForm] fetchSuggestions: Query too short, clearing suggestions.');
      setSuggestions([]);
      return;
    }
    setIsSuggestionsLoading(true);
    setHighlightedIndex(-1);
    try {
      const results: PantryIngredientRow[] = await searchIngredientsByName(query);
      console.log('[PantryItemForm] fetchSuggestions: API results -', results);
      setSuggestions(results.map(r => ({ id: r.id, label: r.name })));
    } catch (err) {
      console.error('Failed to search ingredients:', err);
      setSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
      console.log('[PantryItemForm] fetchSuggestions: Finished, isSuggestionsLoading set to false.');
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
      console.log('[PantryItemForm] DEBOUNCE: Condition met, scheduling fetch for query -', searchQuery);
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else if (!isDropdownVisible) {
      if (searchQuery.trim().length < 3) {
        console.log('[PantryItemForm] DEBOUNCE: Dropdown not visible and query short, clearing suggestions.');
        setSuggestions([]);
      }
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchQuery, formData.name, fetchSuggestions, isDropdownVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        console.log('[PantryItemForm] Clicked outside, hiding dropdown.');
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
    console.log('[PantryItemForm] handleSubmit: Form submitted. highlightedIndex:', highlightedIndex, 'suggestions:', suggestions);
    setFormError(null);
    if (isDropdownVisible && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      console.log('[PantryItemForm] handleSubmit: Submitting via highlighted item selection.');
      handleSuggestionSelect(suggestions[highlightedIndex]);
      return;
    }
    if (!formData.name.trim()) {
      console.log('[PantryItemForm] handleSubmit: Ingredient name is required.');
      setFormError('Ingredient name is required');
      return;
    }
    console.log('[PantryItemForm] handleSubmit: Proceeding with normal form submission.');
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
    console.log('[PantryItemForm] handleInputChange: Value changed to -', newName);
    setFormData({ name: newName });
    setSearchQuery(newName);
    setFormError(null);
    if (!isDropdownVisible && newName.trim().length > 0) {
      console.log('[PantryItemForm] handleInputChange: Making dropdown visible.');
      setIsDropdownVisible(true);
    }
    setHighlightedIndex(-1);
  };

  const handleSuggestionSelect = (selectedSuggestion: DropdownListItem) => {
    console.log('[PantryItemForm] handleSuggestionSelect: Selected -', selectedSuggestion);
    setFormData({ name: selectedSuggestion.label });
    setSearchQuery(selectedSuggestion.label);
    setIsDropdownVisible(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
    inputRef.current?.focus();
  };
  
  const handleInputFocus = () => {
    console.log('[PantryItemForm] handleInputFocus: Input focused. searchQuery:', searchQuery);
    if (searchQuery.trim().length > 0 ) {
      setIsDropdownVisible(true);
      console.log('[PantryItemForm] handleInputFocus: Dropdown visible. Checking if fetch needed.');
      if(searchQuery.trim().length >= 3 && suggestions.length === 0 && !isSuggestionsLoading) {
        console.log('[PantryItemForm] handleInputFocus: Fetching suggestions on focus.');
        fetchSuggestions(searchQuery);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('[PantryItemForm] handleKeyDown: Key pressed -', e.key, 
      '{ isDropdownVisible, suggestionsLength: suggestions.length, isLoading: isSuggestionsLoading, highlightedIndex }');

    if (e.key === 'Tab' && isDropdownVisible) {
        console.log('[PantryItemForm] handleKeyDown: Tab pressed, hiding dropdown.');
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
        return;
    }
    if (!isDropdownVisible || (suggestions.length === 0 && !isSuggestionsLoading)) {
      if (e.key === 'Escape') {
        console.log('[PantryItemForm] handleKeyDown: Escape pressed on inactive/empty dropdown, hiding.');
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && highlightedIndex === -1) {
        console.log('[PantryItemForm] handleKeyDown: Enter on inactive dropdown, allowing form submission.');
      } else if (e.key !== 'Enter') {
        console.log('[PantryItemForm] handleKeyDown: Key', e.key, 'on inactive dropdown, returning.');
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
          console.log('[PantryItemForm] handleKeyDown: Enter pressed, selecting highlighted item.');
          e.preventDefault();
          handleSuggestionSelect(suggestions[highlightedIndex]);
        } else {
          console.log('[PantryItemForm] handleKeyDown: Enter pressed, no item highlighted, hiding dropdown for form submission.');
          setIsDropdownVisible(false);
        }
        break;
      case 'Escape':
        console.log('[PantryItemForm] handleKeyDown: Escape pressed, hiding dropdown.');
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