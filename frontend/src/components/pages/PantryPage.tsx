import React, { useState } from 'react';
import type { PantryItem, CreatePantryItemRequest, UpdatePantryItemRequest } from '../../types/Pantry';
import { usePantryStorage } from '../../hooks/usePantryStorage';
import { PantryItemCard } from '../atoms/PantryItemCard';
import { PantryItemForm } from '../molecules/PantryItemForm';
import { Button } from '../atoms/Button';
import './PantryPage.css';

export const PantryPage: React.FC = () => {
  const { items, isLoading, error, addItem, updateItem, removeItem } = usePantryStorage();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleAddItem = async (data: CreatePantryItemRequest) => {
    setFormLoading(true);
    try {
      await addItem(data);
      setShowForm(false);
    } catch {
      // Error is handled by the hook
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateItem = async (data: UpdatePantryItemRequest) => {
    if (!editingItem) return;
    
    setFormLoading(true);
    try {
      await updateItem(editingItem.id, data);
      setEditingItem(null);
    } catch {
      // Error is handled by the hook
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this item from your pantry?')) {
      await removeItem(id);
    }
  };

  const handleEditItem = (item: PantryItem) => {
    setEditingItem(item);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const sortedItems = [...items].sort((a, b) => {
    // Sort by expiration status first (expired, expiring soon, then by date)
    const now = new Date();
    const aExpired = a.expiresAt && a.expiresAt < now;
    const bExpired = b.expiresAt && b.expiresAt < now;
    
    if (aExpired && !bExpired) return -1;
    if (!aExpired && bExpired) return 1;
    
    const aExpiringSoon = a.expiresAt && a.expiresAt > now && a.expiresAt <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const bExpiringSoon = b.expiresAt && b.expiresAt > now && b.expiresAt <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (aExpiringSoon && !bExpiringSoon) return -1;
    if (!aExpiringSoon && bExpiringSoon) return 1;
    
    // Then sort by expiration date
    if (a.expiresAt && b.expiresAt) {
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    }
    if (a.expiresAt && !b.expiresAt) return -1;
    if (!a.expiresAt && b.expiresAt) return 1;
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return (
      <div className="pantry-page">
        <div className="pantry-page__loading">
          Loading your pantry...
        </div>
      </div>
    );
  }

  return (
    <div className="pantry-page">
      <div className="pantry-page__header">
        <h1 className="pantry-page__title">My Pantry</h1>
        <p className="pantry-page__subtitle">
          Keep track of your ingredients and their expiration dates
        </p>
        
        {!showForm && !editingItem && (
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className="pantry-page__add-button"
          >
            Add Ingredient
          </Button>
        )}
      </div>

      {error && (
        <div className="pantry-page__error">
          {error}
        </div>
      )}

      {(showForm || editingItem) && (
        <div className="pantry-page__form">
          <PantryItemForm
            item={editingItem || undefined}
            onSubmit={editingItem ? 
              (data) => handleUpdateItem(data as UpdatePantryItemRequest) : 
              (data) => handleAddItem(data as CreatePantryItemRequest)
            }
            onCancel={handleCancelForm}
            isLoading={formLoading}
          />
        </div>
      )}

      <div className="pantry-page__content">
        {sortedItems.length === 0 ? (
          <div className="pantry-page__empty">
            <h3>Your pantry is empty</h3>
            <p>Start by adding some ingredients to keep track of what you have.</p>
          </div>
        ) : (
          <div className="pantry-page__items">
            {sortedItems.map((item) => (
              <PantryItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 