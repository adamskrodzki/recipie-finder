import React from 'react';
import type { PantryItem } from '../../types/Pantry';
import { Button } from './Button';
import './PantryItemCard.css';

interface PantryItemCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export const PantryItemCard: React.FC<PantryItemCardProps> = ({
  item,
  onEdit,
  onRemove,
  className = '',
}) => {
  const cardClass = `pantry-item-card ${className}`.trim();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={cardClass}>
      <div className="pantry-item-card__content">
        <div className="pantry-item-card__header">
          <h3 className="pantry-item-card__name">{item.name}</h3>
        </div>
        
        <div className="pantry-item-card__dates">
          <div className="pantry-item-card__added">
            Added: {formatDate(item.addedAt)}
          </div>
        </div>
      </div>
      
      <div className="pantry-item-card__actions">
        <Button
          variant="secondary"
          size="small"
          onClick={() => onEdit(item)}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="small"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}; 