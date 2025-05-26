# Coding Guidelines - AI-Assisted Recipe Finder

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Frontend Guidelines](#frontend-guidelines)
3. [Backend Guidelines](#backend-guidelines)
4. [TypeScript Guidelines](#typescript-guidelines)
5. [Testing Guidelines](#testing-guidelines)
6. [Git Workflow](#git-workflow)
7. [Implementation Patterns](#implementation-patterns)
8. [Feature Development Process](#feature-development-process)

## Project Architecture

### Monorepo Structure
```
/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Express + TypeScript + Node.js
├── package.json       # Root scripts for development
├── SPECIFICATION.md   # Product requirements
└── README.md         # Setup and usage documentation
```

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite, React Router DOM
- **Backend**: Express, TypeScript, Node.js, OpenRouter API
- **Testing**: Jest, React Testing Library, Supertest
- **Storage**: Browser localStorage
- **Styling**: CSS Modules with BEM methodology

## Frontend Guidelines

### Component Architecture (Atomic Design)

Follow the established atomic design pattern:

```
src/components/
├── atoms/           # Basic building blocks (Button, Input, Modal)
├── molecules/       # Simple combinations (FormField, Navigation, Card)
├── organisms/       # Complex components (RecipeList, IngredientsInput)
└── pages/          # Full page components (HomePage, FavoritesPage)
```

#### Atomic Components (`atoms/`)
- **Purpose**: Reusable, single-responsibility UI elements
- **Examples**: Button, Input, StarRating, Modal
- **Guidelines**:
  - Must be completely self-contained
  - Accept props for customization (variant, size, disabled, etc.)
  - Include comprehensive TypeScript interfaces
  - Provide CSS classes following BEM methodology
  - Include unit tests for all variants and states

```typescript
// Example: Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
}) => {
  const buttonClass = `btn btn--${variant} btn--${size} ${className}`.trim();
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClass}
    >
      {children}
    </button>
  );
};
```

#### Molecular Components (`molecules/`)
- **Purpose**: Combinations of atoms that form functional units
- **Examples**: FormField (Label + Input), Navigation, RecipeActions
- **Guidelines**:
  - Compose multiple atomic components
  - Handle specific business logic related to the combination
  - Maintain single responsibility principle
  - Pass through relevant props to child atoms

#### Organism Components (`organisms/`)
- **Purpose**: Complex, feature-complete sections
- **Examples**: RecipeList, IngredientsInput, FavoritesPage
- **Guidelines**:
  - Can contain atoms, molecules, and other organisms
  - Handle complex state management
  - Integrate with hooks and services
  - Implement loading and error states

#### Page Components (`pages/`)
- **Purpose**: Full page layouts and routing
- **Examples**: HomePage, FavoritesPage (when implemented), PantryPage (future)
- **Guidelines**:
  - Compose organisms and handle page-level state
  - Integrate with React Router
  - Handle global error boundaries
  - Implement SEO considerations (meta tags, titles)

### State Management

#### Local State (useState)
Use for component-specific state that doesn't need to be shared:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Custom Hooks
Create custom hooks for reusable stateful logic:
```typescript
// Example: useRecipeStorage.ts
export const useRecipeStorage = (): UseRecipeStorageReturn => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  
  // ... implementation
  
  return {
    favorites,
    ratings,
    toggleFavorite,
    setRating,
    // ... other methods
  };
};
```

#### Service Layer
Use services for data persistence and external API calls:
```typescript
// services/storage.ts - Interface-based design
export interface RecipeStorage {
  getFavorites(): Promise<string[]>;
  addFavorite(recipeId: string): Promise<void>;
  // ... other methods
}

export class LocalStorageRecipeStorage implements RecipeStorage {
  // Implementation
}

export const recipeStorage = createRecipeStorage();
```

### Styling Guidelines

#### CSS Organization
- Use separate CSS files for each component
- Follow BEM (Block Element Modifier) methodology
- Use CSS custom properties for theming
- Implement responsive design with mobile-first approach

```css
/* Component.css */
.component {
  /* Block styles */
}

.component__element {
  /* Element styles */
}

.component--modifier {
  /* Modifier styles */
}

.component__element--modifier {
  /* Element with modifier */
}
```

#### Responsive Design
```css
/* Mobile-first approach */
.component {
  /* Mobile styles */
}

@media (max-width: 768px) {
  /* Tablet adjustments */
}

@media (max-width: 480px) {
  /* Mobile adjustments */
}
```

### Error Handling

#### Component Level
```typescript
const [error, setError] = useState<string | null>(null);

try {
  // API call or operation
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred');
}

// In JSX
{error && (
  <div className="component__error">
    <p>Error: {error}</p>
    <button onClick={() => setError(null)}>Dismiss</button>
  </div>
)}
```

#### Service Level
```typescript
// services/api.ts
export const apiCall = async (data: RequestData): Promise<ResponseData> => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

## Backend Guidelines

### API Structure

#### Endpoint Organization
```typescript
// index.ts - Main server file
app.get('/api/health', healthHandler);
app.post('/api/recipes', recipesHandler);
app.post('/api/recipes/refine', refineHandler);
app.post('/api/pantry', pantryHandler);        // Future
app.get('/api/pantry', getPantryHandler);      // Future
```

#### Request/Response Patterns
```typescript
// types.ts - Shared interfaces
export interface RecipeRequest {
  ingredients: string[];
  pantryIngredients?: string[];  // Future enhancement
}

export interface RecipeResponse {
  recipes: Recipe[];
}

// Error response format
export interface ErrorResponse {
  error: string;
  details?: any;
}
```

#### Validation Pattern
```typescript
app.post('/api/recipes', async (req, res) => {
  try {
    const { ingredients }: RecipeRequest = req.body;
    
    // Input validation
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients array is required' });
    }

    // Process valid ingredients
    const validIngredients = ingredients.filter(ingredient => 
      typeof ingredient === 'string' && ingredient.trim().length > 0
    );

    if (validIngredients.length === 0) {
      return res.status(400).json({ error: 'At least one valid ingredient is required' });
    }

    // Business logic
    const result = await service.processRequest(validIngredients);
    
    res.json(result);
  } catch (error) {
    console.error('Error in endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});
```

### Service Layer Pattern

#### External API Integration
```typescript
// services/openrouter.ts
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async generateRecipes(ingredients: string[]): Promise<Recipe[]> {
    // Implementation with error handling
  }

  async refineRecipe(recipe: Recipe, instruction: string): Promise<Recipe> {
    // Implementation with error handling
  }
}
```

#### Environment Configuration
```typescript
// config.ts
export const config = {
  port: process.env.PORT || 4000,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Validation
if (!config.openRouterApiKey) {
  console.error('OPENROUTER_API_KEY environment variable is required');
  process.exit(1);
}
```

## TypeScript Guidelines

### Type Definitions

#### Interface Design
```typescript
// types/Recipe.ts
export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  rating?: number;
  isFavorite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Use composition for related types
export interface RecipeWithMetadata extends Recipe {
  metadata: {
    source: 'ai-generated' | 'user-created' | 'imported';
    difficulty: 'easy' | 'medium' | 'hard';
    cookingTime: number; // minutes
  };
}
```

#### Generic Types
```typescript
// utils/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

#### Utility Types
```typescript
// types/utils.ts
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Usage
type CreateRecipeRequest = Optional<Recipe, 'id' | 'rating' | 'isFavorite'>;
type UpdateRecipeRequest = RequiredFields<Partial<Recipe>, 'id'>;
```

### Error Handling Types
```typescript
// types/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
```

## Testing Guidelines

### Frontend Testing

#### Component Testing
```typescript
// Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly with default props', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const mockOnClick = jest.fn();
    render(<Component onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('displays error states', () => {
    render(<Component error="Test error" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

#### Hook Testing
```typescript
// useHook.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

describe('useCustomHook', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.value).toBe(initialValue);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles state updates', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### Backend Testing

#### API Endpoint Testing
```typescript
// api.test.ts
import request from 'supertest';
import app from '../index';

describe('POST /api/recipes', () => {
  it('returns recipes for valid ingredients', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(200);

    expect(response.body.recipes).toHaveLength(3);
    expect(response.body.recipes[0]).toHaveProperty('title');
    expect(response.body.recipes[0]).toHaveProperty('ingredients');
    expect(response.body.recipes[0]).toHaveProperty('steps');
  });

  it('returns 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: [] })
      .expect(400);

    expect(response.body.error).toBe('Ingredients array is required');
  });
});
```

#### Service Testing
```typescript
// service.test.ts
import { OpenRouterService } from './openrouter';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService('test-api-key');
  });

  it('generates recipes successfully', async () => {
    // Mock implementation
    const recipes = await service.generateRecipes(['chicken', 'rice']);
    
    expect(recipes).toHaveLength(3);
    expect(recipes[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      ingredients: expect.any(Array),
      steps: expect.any(Array),
    });
  });
});
```

## Git Workflow

### Branch Naming Convention
```
feature/pantry-management
feature/recipe-search-filters
bugfix/recipe-rating-persistence
hotfix/api-error-handling
refactor/component-structure
```

### Commit Message Format
```
type(scope): description

feat(pantry): add ingredient management functionality
fix(recipes): resolve rating persistence issue
refactor(components): restructure atomic design hierarchy
test(api): add comprehensive endpoint testing
docs(readme): update setup instructions
```

### Development Workflow
1. Create feature branch from main
2. Implement feature with tests
3. Run `npm test` to ensure all tests pass
4. Run `npm run lint` to check code quality
5. Make frequent, atomic commits
6. Create pull request with detailed description
7. Code review and merge

## Implementation Patterns

### New Feature Implementation

#### 1. Define Types First
```typescript
// types/Pantry.ts
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
```

#### 2. Create Service Layer
```typescript
// services/pantryStorage.ts
export interface PantryStorage {
  getItems(): Promise<PantryItem[]>;
  addItem(item: Omit<PantryItem, 'id' | 'addedAt'>): Promise<PantryItem>;
  removeItem(id: string): Promise<void>;
  updateItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem>;
}

export class LocalStoragePantryStorage implements PantryStorage {
  private readonly PANTRY_KEY = 'recipe-finder-pantry';
  
  // Implementation
}
```

#### 3. Create Custom Hook
```typescript
// hooks/usePantryStorage.ts
export const usePantryStorage = () => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Implementation
  
  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateItem,
  };
};
```

#### 4. Build Components (Atomic Design)
```typescript
// atoms/PantryItemCard.tsx
// molecules/PantryItemForm.tsx
// organisms/PantryList.tsx
// pages/PantryPage.tsx
```

#### 5. Add API Endpoints (if needed)
```typescript
// backend/src/index.ts
app.get('/api/pantry', getPantryHandler);
app.post('/api/pantry', addPantryItemHandler);
app.put('/api/pantry/:id', updatePantryItemHandler);
app.delete('/api/pantry/:id', deletePantryItemHandler);
```

#### 6. Write Comprehensive Tests
```typescript
// Test all layers: components, hooks, services, API endpoints
```

#### 7. Update Navigation and Routing
```typescript
// App.tsx
<Route path="/pantry" element={<PantryPage />} />

// Navigation.tsx
<Link to="/pantry">Pantry</Link>
```

### Integration Patterns

#### API Integration
```typescript
// services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.recipe-finder.com' 
  : 'http://localhost:4000';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};
```

#### Storage Integration
```typescript
// services/storage.ts - Extend existing pattern
export interface StorageService extends RecipeStorage {
  // Pantry methods
  getPantryItems(): Promise<PantryItem[]>;
  addPantryItem(item: Omit<PantryItem, 'id' | 'addedAt'>): Promise<PantryItem>;
  
  // Future: User preferences
  getUserPreferences(): Promise<UserPreferences>;
  setUserPreferences(prefs: UserPreferences): Promise<void>;
}
```

## Feature Development Process

### 1. Planning Phase
- Review SPECIFICATION.md for requirements
- Create detailed technical design
- Identify affected components and services
- Plan testing strategy

### 2. Implementation Phase
- Create feature branch
- Implement types and interfaces
- Build service layer with error handling
- Create custom hooks for state management
- Build UI components following atomic design
- Add comprehensive tests
- Update documentation

### 3. Integration Phase
- Integrate with existing components
- Update routing and navigation
- Test cross-feature interactions
- Ensure responsive design
- Validate accessibility

### 4. Quality Assurance
- Run full test suite (`npm test`)
- Check linting (`npm run lint`)
- Test in development environment (`npm run dev`)
- Manual testing of user flows
- Performance testing

### 5. Documentation
- Update README.md if needed
- Add inline code documentation
- Update SPECIFICATION.md if requirements change
- Create migration guides for breaking changes

## Best Practices Summary

1. **Follow Atomic Design**: Build from atoms → molecules → organisms → pages
2. **Type Everything**: Use TypeScript interfaces for all data structures
3. **Test Comprehensively**: Unit tests for all components, hooks, and services
4. **Handle Errors Gracefully**: Implement error boundaries and user-friendly messages
5. **Keep Components Pure**: Minimize side effects, use hooks for state management
6. **Optimize Performance**: Use React.memo, useMemo, useCallback where appropriate
7. **Maintain Consistency**: Follow established patterns and naming conventions
8. **Document Decisions**: Comment complex logic and architectural decisions
9. **Mobile-First Design**: Implement responsive design from the start
10. **Accessibility**: Ensure all components are accessible (ARIA labels, keyboard navigation)

This document should be updated as the project evolves and new patterns emerge. 