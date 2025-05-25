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

// Create a test app instance with debug endpoint
const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Create OpenRouter service instance (will be mocked)
  const openRouterService = new OpenRouterService('test-api-key');
  
  // Debug endpoint for testing OpenRouter integration
  app.post('/api/debug/recipes', async (req, res) => {
    try {
      const { ingredients } = req.body;
      const startTime = Date.now();
      
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        const error = 'Ingredients array is required';
        return res.status(400).json({ 
          error,
          debug: {
            timestamp: new Date().toISOString(),
            input: ingredients,
            validationFailed: true
          }
        });
      }

      const validIngredients = ingredients.filter(ingredient => 
        typeof ingredient === 'string' && ingredient.trim().length > 0
      );

      if (validIngredients.length === 0) {
        const error = 'At least one valid ingredient is required';
        return res.status(400).json({ 
          error,
          debug: {
            timestamp: new Date().toISOString(),
            input: ingredients,
            filteredIngredients: validIngredients,
            validationFailed: true
          }
        });
      }

      const recipes = await openRouterService.generateRecipes(validIngredients);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      res.json({ 
        recipes,
        debug: {
          timestamp: new Date().toISOString(),
          input: ingredients,
          filteredIngredients: validIngredients,
          duration: duration,
          recipesCount: recipes.length,
          success: true
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipes';
      res.status(500).json({ 
        error: errorMessage,
        debug: {
          timestamp: new Date().toISOString(),
          input: req.body.ingredients,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          success: false
        }
      });
    }
  });

  return app;
};

describe('Debug Recipes Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      title: 'Test Recipe 1',
      ingredients: ['ingredient1', 'ingredient2'],
      steps: ['step1', 'step2']
    },
    {
      id: '2',
      title: 'Test Recipe 2',
      ingredients: ['ingredient3', 'ingredient4'],
      steps: ['step3', 'step4']
    },
    {
      id: '3',
      title: 'Test Recipe 3',
      ingredients: ['ingredient5', 'ingredient6'],
      steps: ['step5', 'step6']
    }
  ];

  describe('POST /api/debug/recipes', () => {
    it('should return recipes with debug information on success', async () => {
      mockGenerateRecipes.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .post('/api/debug/recipes')
        .send({ ingredients: ['chicken', 'vegetables'] })
        .expect(200);

      expect(response.body.recipes).toEqual(mockRecipes);
      expect(response.body.debug).toMatchObject({
        input: ['chicken', 'vegetables'],
        filteredIngredients: ['chicken', 'vegetables'],
        recipesCount: 3,
        success: true
      });
      expect(response.body.debug.timestamp).toBeDefined();
      expect(response.body.debug.duration).toBeGreaterThanOrEqual(0);
      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken', 'vegetables']);
    });

    it('should return debug info for validation errors', async () => {
      const response = await request(app)
        .post('/api/debug/recipes')
        .send({ ingredients: [] })
        .expect(400);

      expect(response.body.error).toBe('Ingredients array is required');
      expect(response.body.debug).toMatchObject({
        input: [],
        validationFailed: true
      });
      expect(response.body.debug.timestamp).toBeDefined();
      expect(mockGenerateRecipes).not.toHaveBeenCalled();
    });

    it('should return debug info for empty ingredients after filtering', async () => {
      const response = await request(app)
        .post('/api/debug/recipes')
        .send({ ingredients: ['', '   ', null] })
        .expect(400);

      expect(response.body.error).toBe('At least one valid ingredient is required');
      expect(response.body.debug).toMatchObject({
        input: ['', '   ', null],
        filteredIngredients: [],
        validationFailed: true
      });
      expect(mockGenerateRecipes).not.toHaveBeenCalled();
    });

    it('should return detailed error debug info when service throws error', async () => {
      const testError = new Error('OpenRouter API error');
      mockGenerateRecipes.mockRejectedValue(testError);

      const response = await request(app)
        .post('/api/debug/recipes')
        .send({ ingredients: ['chicken'] })
        .expect(500);

      expect(response.body.error).toBe('OpenRouter API error');
      expect(response.body.debug).toMatchObject({
        input: ['chicken'],
        errorType: 'object',
        errorConstructor: 'Error',
        errorMessage: 'OpenRouter API error',
        success: false
      });
      expect(response.body.debug.timestamp).toBeDefined();
      expect(response.body.debug.errorStack).toBeDefined();
      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken']);
    });

    it('should handle non-Error exceptions', async () => {
      mockGenerateRecipes.mockRejectedValue('String error');

      const response = await request(app)
        .post('/api/debug/recipes')
        .send({ ingredients: ['chicken'] })
        .expect(500);

      expect(response.body.error).toBe('Failed to generate recipes');
      expect(response.body.debug).toMatchObject({
        input: ['chicken'],
        errorType: 'string',
        errorMessage: 'String error',
        success: false
      });
    });

    it('should filter ingredients and include debug info', async () => {
      mockGenerateRecipes.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .post('/api/debug/recipes')
        .send({ ingredients: ['chicken', '', 'vegetables', '   ', 123, null] })
        .expect(200);

      expect(response.body.debug).toMatchObject({
        input: ['chicken', '', 'vegetables', '   ', 123, null],
        filteredIngredients: ['chicken', 'vegetables'],
        recipesCount: 3,
        success: true
      });
      expect(mockGenerateRecipes).toHaveBeenCalledWith(['chicken', 'vegetables']);
    });
  });
}); 