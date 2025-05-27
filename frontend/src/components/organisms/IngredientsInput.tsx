import { useState, useEffect, useCallback, useRef } from 'react';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Card, CardContent } from '../molecules/Card';
import { PantryIngredients } from '../molecules/PantryIngredients';
import './IngredientsInput.css';
import { Select, type SelectOption } from '../atoms/Select';

import { DropdownList, type DropdownListItem } from '../atoms/DropdownList';
import { searchIngredientsByName, type PantryIngredientRow } from '../../services/pantryService';

const LISTBOX_ID = 'ingredients-suggestions-listbox';

interface IngredientsInputProps {
  onSubmit: (ingredients: string[], mealType?: string) => void;
  isLoading?: boolean;
  hasRecipes?: boolean;
}

// Define meal type options
const mealTypeOptions: SelectOption[] = [
  { value: 'any', label: 'Any Meal Type' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
];

export const IngredientsInput: React.FC<IngredientsInputProps> = ({ 
  onSubmit, 
  isLoading = false,
  hasRecipes = false
}) => {
  const [ingredients, setIngredients] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse when recipes are loaded
  const shouldCollapse = hasRecipes && !isLoading;

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState(''); // The current ingredient being typed
  const [suggestions, setSuggestions] = useState<DropdownListItem[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [highlightedIndex, _setHighlightedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
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


  const fetchSuggestionsInternal = useCallback(async (query: string) => {
    if (query.trim().length < 2) { // Adjusted to 2 for faster suggestions in a list
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
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (isDropdownVisible && searchQuery.trim().length > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestionsInternal(searchQuery);
      }, 300);
    } else if (!isDropdownVisible) {
       if (searchQuery.trim().length < 2) {
        setSuggestions([]);
      }
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchQuery, fetchSuggestionsInternal, isDropdownVisible]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownVisible(false); // Hide dropdown on submit
    
    if (!ingredients.trim()) {
      return;
    }

    // Parse comma-separated ingredients and clean them up
    const ingredientList = ingredients
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);

    if (ingredientList.length > 0) {
      // Pass selectedMealType to onSubmit, if 'any' is selected, pass undefined
      const mealTypeToSubmit = selectedMealType === 'any' ? undefined : selectedMealType;
      console.log('Submitting ingredients:', ingredientList, 'and meal type:', mealTypeToSubmit);
      onSubmit(ingredientList, mealTypeToSubmit);
    }
  };

  const getCurrentIngredientPrefix = (value: string, cursorPosition: number | null): string => {
    if (cursorPosition === null) return '';
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastCommaIndex = textBeforeCursor.lastIndexOf(',');
    return textBeforeCursor.substring(lastCommaIndex + 1).trimStart();
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIngredients(newValue);

    const cursorPosition = e.target.selectionStart;
    const currentQuery = getCurrentIngredientPrefix(newValue, cursorPosition);
    setSearchQuery(currentQuery);
    
    if (currentQuery.trim().length > 0 && !isDropdownVisible) {
      setIsDropdownVisible(true);
    } else if (currentQuery.trim().length === 0 && isDropdownVisible) {
      setIsDropdownVisible(false);
    }
    setHighlightedIndex(-1);
  };

  const handleSuggestionSelect = (selectedSuggestion: DropdownListItem) => {
    const currentInputValue = ingredients;
    const cursorPosition = inputRef.current?.selectionStart ?? currentInputValue.length;
    
    const textBeforeCursor = currentInputValue.substring(0, cursorPosition);
    const textAfterCursor = currentInputValue.substring(cursorPosition);
    
    const lastCommaIndexBeforeCursor = textBeforeCursor.lastIndexOf(',');
    
    // Determine the start of the text to be replaced
    // If there's a comma, it's after the comma. Otherwise, it's the beginning of the string.
    const replaceStartIndex = lastCommaIndexBeforeCursor === -1 ? 0 : lastCommaIndexBeforeCursor + 1;
    
    // The part of the string before the ingredient we're replacing
    const prefix = currentInputValue.substring(0, replaceStartIndex);
    
    // Find the next comma after the cursor to correctly replace the current token
    // This ensures we don't clear text the user typed *after* the part they intended to autocomplete
    let textAfterCurrentQueryToken = textAfterCursor;
    const currentQueryForReplacement = getCurrentIngredientPrefix(currentInputValue, cursorPosition);
    if(textAfterCursor.toLowerCase().startsWith(currentQueryForReplacement.substring(searchQuery.length).toLowerCase())){
        textAfterCurrentQueryToken = textAfterCursor.substring(currentQueryForReplacement.length - searchQuery.length);
    }


    const nextCommaInSuffix = textAfterCurrentQueryToken.indexOf(',');
    let suffix = '';
    if (nextCommaInSuffix !== -1) {
        suffix = textAfterCurrentQueryToken.substring(nextCommaInSuffix);
    }


    let newIngredientsValue = prefix.trimStart();
    if (newIngredientsValue && !newIngredientsValue.endsWith(',')) { // Add space if prefix exists and is not ending with comma
        newIngredientsValue += ' ';
    }
    newIngredientsValue += selectedSuggestion.label;
    newIngredientsValue += ', '; // Add comma and space after selected suggestion
    newIngredientsValue += suffix.trimStart(); // Add the rest of the string

    // Clean up: remove trailing/leading commas/spaces, double commas
    newIngredientsValue = newIngredientsValue.replace(/,\s*$/, "").replace(/^,/, "").trim();
    newIngredientsValue = newIngredientsValue.replace(/,\s*,/g, ',');
    newIngredientsValue = newIngredientsValue.replace(/,,\s*/g, ','); // Handle cases like "item1,, item3"
    newIngredientsValue = newIngredientsValue.replace(/\s{2,}/g, ' '); // Normalize multiple spaces to one


    setIngredients(newIngredientsValue);
    setSearchQuery('');
    setSuggestions([]);
    setIsDropdownVisible(false);
    setHighlightedIndex(-1);
    
    // Focus and set cursor position after the newly added ingredient and the following comma-space
    setTimeout(() => {
      inputRef.current?.focus();
      let newCursorPos = prefix.trimStart().length;
      if (newCursorPos > 0 && !prefix.trimStart().endsWith(',')) newCursorPos +=1; // for the space
      newCursorPos += selectedSuggestion.label.length;
      newCursorPos += 2; // For ", "
      
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInputFocus = () => {
    const currentQuery = getCurrentIngredientPrefix(ingredients, inputRef.current?.selectionStart ?? ingredients.length);
    if (currentQuery.trim().length > 0) {
      setIsDropdownVisible(true);
       if(currentQuery.trim().length >= 2 && suggestions.length === 0 && !isSuggestionsLoading) {
        fetchSuggestionsInternal(currentQuery);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && isDropdownVisible) {
      // If a suggestion is highlighted, select it on Tab
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault(); // Prevent tabbing away
        handleSuggestionSelect(suggestions[highlightedIndex]);
      } else {
        // If no suggestion is highlighted, let Tab behave normally but hide dropdown
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
      }
      return;
    }

    if (!isDropdownVisible || (suggestions.length === 0 && !isSuggestionsLoading)) {
      if (e.key === 'Escape') {
        setIsDropdownVisible(false);
        setHighlightedIndex(-1);
        e.preventDefault();
      }
      // Allow Enter for form submission if dropdown is not active for selection
      if (e.key === 'Enter' && highlightedIndex === -1) {
          // Normal form submission will be handled by the form's onSubmit
          setIsDropdownVisible(false); 
      }
      return;
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
          // If Enter is pressed and no suggestion is highlighted,
          // hide the dropdown and let the form submit.
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


  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNewSearch = () => {
    setIngredients('');
    setSearchQuery('');
    setSuggestions([]);
    setIsDropdownVisible(false);
    setIsCollapsed(false);
    setSelectedMealType(undefined);
  };

  const handlePantryIngredientClick = (ingredient: string) => {
    const currentIngredientsList = ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    if (!currentIngredientsList.includes(ingredient.trim())) {
      let newIngredientsString = ingredients.trim();
      if (newIngredientsString.length > 0 && !newIngredientsString.endsWith(',')) {
        newIngredientsString += ', ';
      }
      newIngredientsString += ingredient.trim();
       if (newIngredientsString.endsWith(',')) { // If it somehow ends with a comma
        newIngredientsString = newIngredientsString.slice(0, -1).trim();
      }
      newIngredientsString += ', '; // Add a comma and space for the next ingredient
      setIngredients(newIngredientsString);
    }
    // Focus input and set cursor at the end
    setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
        }
    }, 0);
  };

  const currentDropdownItemId = highlightedIndex >=0 && suggestions[highlightedIndex] ? `dropdown-list__item--${suggestions[highlightedIndex].id}` : undefined;

  return (
    <div className={`ingredients-input-container ${shouldCollapse ? 'ingredients-input-container--collapsible' : ''}`}>
      {shouldCollapse && (
        <div className="ingredients-input__header">
          <button
            className="ingredients-input__toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand ingredients input' : 'Collapse ingredients input'}
          >
            <span className="ingredients-input__toggle-icon">
              {isCollapsed ? '▼' : '▲'}
            </span>
            <span className="ingredients-input__toggle-text">
              {isCollapsed ? 'Search New Recipes' : 'Hide Search'}
            </span>
          </button>
        </div>
      )}

      <div className={`ingredients-input__content ${shouldCollapse && isCollapsed ? 'ingredients-input__content--collapsed' : ''}`}>
        <Card className="ingredients-input">
          <CardContent>
            <form onSubmit={handleSubmit} className="ingredients-input__form">
              <PantryIngredients onIngredientClick={handlePantryIngredientClick} />
              
              <div style={{ position: 'relative' }} ref={dropdownContainerRef}
                role="combobox"
                aria-expanded={isDropdownVisible && suggestions.length > 0}
                aria-haspopup="listbox"
                aria-owns={LISTBOX_ID}
              >
                <FormField
                  id="ingredients"
                  label="Enter your available ingredients (comma-separated):"
                  value={ingredients}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., chicken, rice, tomatoes"
                  disabled={isLoading}
                  required
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
                    className="ingredients-input__dropdown" // Ensure this class provides proper styling
                    emptyMessage={
                      isSuggestionsLoading ? "Loading..."
                      : searchQuery.trim().length < 2 ? "Type at least 2 characters"
                      : "No matching ingredients"
                    }
                    highlightedIndex={highlightedIndex}
                    assignItemRef={assignSuggestionItemRef}
                    listId={LISTBOX_ID}
                  />
                )}
              </div>

              <Select
                id="mealType"
                label="Select Meal Type (optional):"
                options={mealTypeOptions}
                value={selectedMealType || 'any'}
                onChange={(e) => setSelectedMealType(e.target.value === 'any' ? undefined : e.target.value)}
                className="ingredients-input__meal-type-selector"
              />
              
              <div className="ingredients-input__actions">
                <Button 
                  type="submit" 
                  variant="primary"
                  size="large"
                  disabled={isLoading || !ingredients.trim()}
                  className="ingredients-input__submit"
                >
                  {isLoading ? 'Finding Recipes...' : 'Find Recipes'}
                </Button>
                
                {shouldCollapse && ingredients && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    size="large"
                    onClick={handleNewSearch}
                    className="ingredients-input__clear"
                  >
                    Clear & Start Over
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 