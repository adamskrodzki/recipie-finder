import request from 'supertest';
import app from '../src/index';

describe('POST /api/recipes', () => {
  it('returns 200 and a recipes array with correct shape', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: ['carrot', 'pasta'] })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
    expect(res.body.recipes.length).toBeGreaterThanOrEqual(2);
    for (const recipe of res.body.recipes) {
      expect(typeof recipe.title).toBe('string');
      expect(Array.isArray(recipe.ingredients)).toBe(true);
      expect(Array.isArray(recipe.steps)).toBe(true);
    }
  });

  it('returns 400 if ingredients is missing or not an array', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ingredients: 'not-an-array' })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
