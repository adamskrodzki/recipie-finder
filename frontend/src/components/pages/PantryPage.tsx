import React, { useState, useMemo, useCallback } from 'react';
import {
  usePantryStorage,
  type PantryItem as HookPantryItem,
  type CreatePantryItemRequest,
  type UpdatePantryItemRequest
} from '../../hooks/usePantryStorage';
import { PantryItemCard } from '../atoms/PantryItemCard';
import { PantryItemForm } from '../molecules/PantryItemForm';
import type { PantryItem as FormPantryItem } from '../../types/Pantry';
import { Button } from '../atoms/Button';
import './PantryPage.css';

// Memoized static header component
const PantryPageHeader: React.FC<{ 
  showForm: boolean;
  editingItem: HookPantryItem | null;
  onShowForm: () => void;
}> = React.memo(({ showForm, editingItem, onShowForm }) => (
  <div className="pantry-page__header">
    <h1 className="pantry-page__title">My Pantry</h1>
    <p className="pantry-page__subtitle">
      Keep track of your available ingredients
    </p>
    
    {!showForm && !editingItem && (
      <Button
        variant="primary"
        onClick={onShowForm}
        className="pantry-page__add-button"
      >
        Add Ingredient
      </Button>
    )}
  </div>
));

PantryPageHeader.displayName = 'PantryPageHeader';

// Memoized empty state component
const EmptyPantryState: React.FC = React.memo(() => (
  <div className="pantry-page__empty">
    <h3>Your pantry is empty</h3>
    <p>Start by adding some ingredients to keep track of what you have.</p>
  </div>
));

EmptyPantryState.displayName = 'EmptyPantryState';

export const PantryPage: React.FC = () => {
  const { items: hookItems, initialLoading, error, addItem, updateItem, removeItem } = usePantryStorage();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HookPantryItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const toDisplayItem = useCallback((item: HookPantryItem): FormPantryItem => ({
    id: item.id,
    name: item.ingredient_name,
    addedAt: new Date(item.added_at),
  }), []);

  const handleAddItem = useCallback(async (data: CreatePantryItemRequest) => {
    setFormLoading(true);
    try {
      await addItem(data);
      setShowForm(false);
    } catch {
      // Error is handled by the hook
    } finally {
      setFormLoading(false);
    }
  }, [addItem]);

  const handleUpdateItem = useCallback(async (formData: { name: string }) => {
    if (!editingItem) return;
    
    setFormLoading(true);
    try {
      const updatePayload: UpdatePantryItemRequest = {
        ingredient_name: formData.name,
      };
      await updateItem(editingItem.id, updatePayload);
      setEditingItem(null);
    } catch {
      // Error is handled by the hook
    } finally {
      setFormLoading(false);
    }
  }, [editingItem, updateItem]);

  const handleRemoveItem = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to remove this item from your pantry?')) {
      await removeItem(id);
    }
  }, [removeItem]);

  const handleEditItem = useCallback((item: HookPantryItem) => {
    setEditingItem(item);
    setShowForm(false);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const handleShowForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const sortedDisplayItems = useMemo(() => 
    hookItems
      .map(toDisplayItem)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [hookItems, toDisplayItem]
  );

  if (initialLoading) {
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
      <PantryPageHeader 
        showForm={showForm}
        editingItem={editingItem}
        onShowForm={handleShowForm}
      />

      {error && (
        <div className="pantry-page__error">
          {error}
        </div>
      )}

      {(showForm || editingItem) && (
        <div className="pantry-page__form">
          <PantryItemForm
            item={editingItem ? toDisplayItem(editingItem) : undefined}
            onSubmit={editingItem ? 
              (data) => handleUpdateItem(data as { name: string }) : 
              (data) => handleAddItem(data as CreatePantryItemRequest)
            }
            onCancel={handleCancelForm}
            isLoading={formLoading}
          />
        </div>
      )}

      <div className="pantry-page__content">
        {sortedDisplayItems.length === 0 ? (
          <EmptyPantryState />
        ) : (
          <div className="pantry-page__items">
            {sortedDisplayItems.map((item) => (
              <PantryItemCard
                key={item.id}
                item={item}
                onEdit={() => handleEditItem(hookItems.find(hi => hi.id === item.id)!)}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 