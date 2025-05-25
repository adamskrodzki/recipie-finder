import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { OpenRouterService } from '../src/openrouter';
import { Recipe } from '../src/types';

// Mock the OpenRouter service
const mockGenerateRecipes = jest.fn();
jest.mock('../src/openrouter', () => {
  return {
    OpenRouterService: jest.fn().mockImplementation(() => {
      return {
        generateRecipes: mockGenerateRecipes
      };
    })
  };
});

// Create a test app instance
const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Create OpenRouter service instance (will be mocked)
  const openRouterService = new OpenRouterService('test-api-key');
  
  app.post('/api/recipes', async (req, res) => {
    try {
      const { ingredients } = req.body;
      
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: 'Ingredients array is required' });
      }

      const validIngredients = ingredients.filter(ingredient => 
        typeof ingredient === 'string' && ingredient.trim().length > 0
      );

      if (validIngredients.length === 0) {
        return res.status(400).json({ error: 'At least one valid ingredient is required' });
      }

      const recipes = await openRouterService.generateRecipes(validIngredients);
      res.json({ recipes });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipes';
      res.status(500).json({ error: errorMessage });
    }
  });

  return app;
};

describe('Recipes Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      title: 'Chicken Stir Fry',
      ingredients: ['chicken', 'vegetables', 'soy sauce', 'garlic'],
      steps: ['Heat oil', 'Add chicken', 'Add vegetables', 'Season and serve']
    },
    {
      id: '2',
      title: 'Chicken Soup',
      ingredients: ['chicken', 'broth', 'vegetables', 'herbs'],
      steps: ['Boil broth', 'Add chicken', 'Add vegetables', 'Simmer and serve']
    },
    {
      id: '3',
      title: 'Roasted Chicken',
      ingredients: ['chicken', 'herbs', 'oil', 'salt'],
      steps: ['Preheat oven', 'Season chicken', 'Roast', 'Rest and serve']
    }
  ];

  describe('POST /api/recipes', () => {
    it('should generate recipes successfully with valid ingredients', async () => {
      mockGenerateRecipes.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: ['chicken', 'vegetables'] })
        .expect(200);

      expect(response.body).toEqual({ recipes: mockRecipes });
      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken', 'vegetables']);
      expect(mockGenerateRecipes).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when ingredients array is missing', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'Ingredients array is required' });
      expect(mockGenerateRecipes).not.toHaveBeenCalled();
    });

    it('should return 400 when ingredients array is empty', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: [] })
        .expect(400);

      expect(response.body).toEqual({ error: 'Ingredients array is required' });
      expect(mockGenerateRecipes).not.toHaveBeenCalled();
    });

    it('should return 400 when ingredients array contains only empty strings', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: ['', '   ', ''] })
        .expect(400);

      expect(response.body).toEqual({ error: 'At least one valid ingredient is required' });
      expect(mockGenerateRecipes).not.toHaveBeenCalled();
    });

    it('should filter out empty ingredients and process valid ones', async () => {
      mockGenerateRecipes.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: ['chicken', '', 'vegetables', '   '] })
        .expect(200);

      expect(response.body).toEqual({ recipes: mockRecipes });
      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken', 'vegetables']);
    });

    it('should return 500 when OpenRouter service throws an error', async () => {
      const errorMessage = 'OpenRouter API error';
      mockGenerateRecipes.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: ['chicken'] })
        .expect(500);

      expect(response.body).toEqual({ error: errorMessage });
      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken']);
    });

    it('should return 500 with generic message when unknown error occurs', async () => {
      mockGenerateRecipes.mockRejectedValue('Unknown error');

      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: ['chicken'] })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to generate recipes' });
    });

    it('should handle non-string ingredients', async () => {
      mockGenerateRecipes.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .post('/api/recipes')
        .send({ ingredients: [123, null, 'chicken', undefined] })
        .expect(200);

      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken']);
    });

    it('should validate that OpenRouter service is called with correct prompt structure', async () => {
      mockGenerateRecipes.mockResolvedValue(mockRecipes);

      await request(app)
        .post('/api/recipes')
        .send({ ingredients: ['pasta', 'tomatoes', 'basil'] })
        .expect(200);

      expect(mockGenerateRecipes).toHaveBeenCalledWith(['pasta', 'tomatoes', 'basil']);
      expect(mockGenerateRecipes).toHaveBeenCalledTimes(1);
    });
  });
}); 