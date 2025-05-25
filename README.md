# AI-Assisted Recipe Finder

A full-stack web app that helps home cooks turn a list of ingredients into AI-generated recipes.  
Built with React + TypeScript on the frontend, Node + TypeScript + Express on the backend, and OpenRouter for LLM calls.

## Features
- Enter ingredients (text or tags) and fetch 3 recipe suggestions from an AI model
- View recipe details: title, ingredient list, step-by-step instructions
- “Refine” any recipe with custom instructions (e.g. “Make it gluten-free”)
- Favorite & rate recipes (1–5 stars) stored locally
- Browse saved favorites on a dedicated page
- Loading indicators and error messages for network/AI issues

## Tech Stack
- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript
- AI Integration: OpenRouter API
- Storage: browser localStorage for favorites & ratings

## Prerequisites
- Node.js v18+  
- An OpenRouter API key (set in `backend/.env`)

## Getting Started

1. Clone the repo  
   ```bash
   git clone <your-repo-url>
   cd ai-recipe-finder

2. Install dependencies

    npm install
    cd frontend && npm install && cd ..
    cd backend  && npm install && cd ..

3. Create your environment file
    In backend/.env:
    OPENROUTER_API_KEY=your_api_key_here

4. Run in development mode
    
    npm run dev

## Testing

This project includes comprehensive automated tests for both frontend and backend components.

### Running Tests

Run all tests (backend + frontend):
```bash
npm test
```

Run backend tests only:
```bash
cd backend && npm test
```

Run frontend tests only:
```bash
cd frontend && npm test
```

### Test Coverage

- **Backend Tests**: API endpoint testing using Jest and Supertest
  - Health endpoint verification (`/api/health`)
  - Response format and status code validation
  
- **Frontend Tests**: Component testing using Jest and React Testing Library
  - App component rendering verification
  - Form element presence and structure
  - User interface element accessibility

### Expected Output

When running `npm test`, you should see:
- Backend: 2 tests passing (health endpoint tests)
- Frontend: 3 tests passing (App component tests)
- All tests should exit with code 0

## Project Structure

/README.md
/SPECIFICATION.md
/package.json        # root scripts
/frontend            # Vite + React app
/backend             # Express + TypeScript API
