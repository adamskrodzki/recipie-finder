import React from 'react';
import { usePantryStorage } from '../../hooks/usePantryStorage';
import { Button } from '../atoms/Button';
import './PantryIngredients.css';

interface PantryIngredientsProps {
  onIngredientClick: (ingredient: string) => void;
  className?: string;
}

export const PantryIngredients: React.FC<PantryIngredientsProps> = ({
  onIngredientClick,
  className = '',
}) => {
  const { items, isLoading } = usePantryStorage();

  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <div className={`pantry-ingredients ${className}`.trim()}>
      <div className="pantry-ingredients__header">
        <span className="pantry-ingredients__label">From your pantry:</span>
      </div>
      <div className="pantry-ingredients__items">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="secondary"
            size="small"
            onClick={() => onIngredientClick(item.ingredient_name)}
            className="pantry-ingredients__item"
          >
            {item.ingredient_name}
          </Button>
        ))}
      </div>
    </div>
  );
}; 