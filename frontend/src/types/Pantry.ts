export interface PantryItem {
  id: string;
  name: string;
  addedAt: Date;
}

export interface PantryRequest {
  items: Omit<PantryItem, 'id' | 'addedAt'>[];
}

export interface CreatePantryItemRequest {
  name: string;
}

export interface UpdatePantryItemRequest {
  id: string;
  name?: string;
} 