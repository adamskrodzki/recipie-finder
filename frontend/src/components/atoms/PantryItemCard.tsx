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
  const isExpired = item.expiresAt && item.expiresAt < new Date();
  const isExpiringSoon = item.expiresAt && 
    item.expiresAt > new Date() && 
    item.expiresAt <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const cardClass = `pantry-item-card ${isExpired ? 'pantry-item-card--expired' : ''} ${isExpiringSoon ? 'pantry-item-card--expiring' : ''} ${className}`.trim();

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
          {item.category && (
            <span className="pantry-item-card__category">{item.category}</span>
          )}
        </div>
        
        <div className="pantry-item-card__dates">
          <div className="pantry-item-card__added">
            Added: {formatDate(item.addedAt)}
          </div>
          {item.expiresAt && (
            <div className={`pantry-item-card__expires ${isExpired ? 'pantry-item-card__expires--expired' : ''} ${isExpiringSoon ? 'pantry-item-card__expires--expiring' : ''}`}>
              {isExpired ? 'Expired: ' : 'Expires: '}{formatDate(item.expiresAt)}
            </div>
          )}
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