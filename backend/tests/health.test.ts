import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Create a test app instance
const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  return app;
};

describe('Health Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp();
  });

  it('should return status ok when GET /api/health is called', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should return JSON content type', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/json/);
  });
}); 