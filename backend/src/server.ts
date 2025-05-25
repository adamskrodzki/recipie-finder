import app from './index.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(4000, () => {
    console.log('Backend listening on http://localhost:4000');
  });
}
