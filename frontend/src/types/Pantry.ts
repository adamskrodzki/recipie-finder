export interface PantryItem {
  id: string;
  name: string;
  category?: string;
  addedAt: Date;
  expiresAt?: Date;
}

export interface PantryRequest {
  items: Omit<PantryItem, 'id' | 'addedAt'>[];
}

export interface CreatePantryItemRequest {
  name: string;
  category?: string;
  expiresAt?: Date;
}

export interface UpdatePantryItemRequest {
  id: string;
  name?: string;
  category?: string;
  expiresAt?: Date;
} 