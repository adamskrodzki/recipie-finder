import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

// Re-export everything
export * from '@testing-library/react';

// Override render method
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export { customRender as render }; 