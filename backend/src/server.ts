/* global process, URL */

import app from './index.js';

// Use a robust check for ESM main module
if (process.argv[1] === new URL('', import.meta.url).pathname) {
  app.listen(4000, () => {
    console.log('Backend listening on http://localhost:4000');
  });
}
