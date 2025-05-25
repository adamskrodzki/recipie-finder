import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { Recipe } from '../src/types';
import { getRecipes } from '../src/routes/recipes';

// Create a test app instance
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/recipes', getRecipes);

  return app;
};

describe('POST /api/recipes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 200 status code', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['tomato', 'pasta', 'cheese'] });

    expect(response.status).toBe(200);
  });

  it('should return an array of recipes', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['tomato', 'pasta', 'cheese'] });

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return recipes with correct shape', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['tomato', 'pasta', 'cheese'] });

    const recipes = response.body;
    
    recipes.forEach((recipe: any) => {
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('title');
      expect(recipe).toHaveProperty('ingredients');
      expect(recipe).toHaveProperty('steps');
      
      expect(typeof recipe.id).toBe('string');
      expect(typeof recipe.title).toBe('string');
      expect(Array.isArray(recipe.ingredients)).toBe(true);
      expect(Array.isArray(recipe.steps)).toBe(true);
      
      // Ensure ingredients and steps arrays contain strings
      recipe.ingredients.forEach((ingredient: any) => {
        expect(typeof ingredient).toBe('string');
      });
      
      recipe.steps.forEach((step: any) => {
        expect(typeof step).toBe('string');
      });
    });
  });

  it('should return at least two recipes', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['tomato', 'pasta', 'cheese'] });

    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return recipes with specific IDs', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['tomato', 'pasta', 'cheese'] });

    const recipes = response.body;
    const recipeIds = recipes.map((recipe: Recipe) => recipe.id);
    
    expect(recipeIds).toContain('r1');
    expect(recipeIds).toContain('r2');
  });

  it('should handle empty ingredients array', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: [] });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('should handle missing ingredients property', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('should return JSON content type', async () => {
    const response = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['tomato', 'pasta', 'cheese'] });

    expect(response.headers['content-type']).toMatch(/json/);
  });
}); 