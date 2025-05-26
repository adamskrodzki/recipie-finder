import { useState } from 'react';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Card, CardContent } from '../molecules/Card';
import { PantryIngredients } from '../molecules/PantryIngredients';
import './IngredientsInput.css';

interface IngredientsInputProps {
  onSubmit: (ingredients: string[]) => void;
  isLoading?: boolean;
  hasRecipes?: boolean;
}

export const IngredientsInput: React.FC<IngredientsInputProps> = ({ 
  onSubmit, 
  isLoading = false,
  hasRecipes = false
}) => {
  const [ingredients, setIngredients] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse when recipes are loaded
  const shouldCollapse = hasRecipes && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ingredients.trim()) {
      return;
    }

    // Parse comma-separated ingredients and clean them up
    const ingredientList = ingredients
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);

    if (ingredientList.length > 0) {
      onSubmit(ingredientList);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIngredients(e.target.value);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNewSearch = () => {
    setIngredients('');
    setIsCollapsed(false);
  };

  const handlePantryIngredientClick = (ingredient: string) => {
    // Parse existing ingredients
    const currentIngredients = ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    // Check if ingredient is already in the list
    if (!currentIngredients.includes(ingredient)) {
      // Add the new ingredient
      const newIngredients = [...currentIngredients, ingredient];
      setIngredients(newIngredients.join(', '));
    }
  };

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
              
              <FormField
                id="ingredients"
                label="Enter your available ingredients (comma-separated):"
                value={ingredients}
                onChange={handleInputChange}
                placeholder="e.g., chicken, rice, tomatoes, onions"
                disabled={isLoading}
                required
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