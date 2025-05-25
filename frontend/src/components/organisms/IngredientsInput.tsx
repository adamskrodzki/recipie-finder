import { useState } from 'react';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Card, CardContent } from '../molecules/Card';
import './IngredientsInput.css';

interface IngredientsInputProps {
  onSubmit: (ingredients: string[]) => void;
  isLoading?: boolean;
}

export const IngredientsInput: React.FC<IngredientsInputProps> = ({ 
  onSubmit, 
  isLoading = false 
}) => {
  const [ingredients, setIngredients] = useState('');

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

  return (
    <Card className="ingredients-input">
      <CardContent>
        <form onSubmit={handleSubmit} className="ingredients-input__form">
          <FormField
            id="ingredients"
            label="Enter your available ingredients (comma-separated):"
            value={ingredients}
            onChange={handleInputChange}
            placeholder="e.g., chicken, rice, tomatoes, onions"
            disabled={isLoading}
            required
          />
          
          <Button 
            type="submit" 
            variant="primary"
            size="large"
            disabled={isLoading || !ingredients.trim()}
            className="ingredients-input__submit"
          >
            {isLoading ? 'Finding Recipes...' : 'Find Recipes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}; 