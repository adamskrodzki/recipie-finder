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
- AI Integration: OpenRouter API with GPT-3.5-turbo
- Storage: browser localStorage for favorites & ratings

## AI Integration Details
The backend integrates with OpenRouter to generate recipes using advanced prompting techniques:

- **System Prompts**: Establishes the AI as an expert chef with clear guidelines
- **Few-Shot Prompting**: Includes example request/response pairs to improve output quality
- **Tool Calling**: Uses OpenRouter's structured output feature to ensure consistent JSON responses
- **Error Handling**: Comprehensive validation and error handling for API failures

The AI generates exactly 3 diverse recipes using the provided ingredients, with each recipe including:
- Creative recipe titles
- Complete ingredient lists (including additional pantry staples)
- Step-by-step cooking instructions
- Diverse cooking methods and cuisines

## Prerequisites
- Node.js v18+  
- An OpenRouter API key (set in `backend/.env`)
  - Sign up at [OpenRouter](https://openrouter.ai/) to get your API key
  - The app uses GPT-3.5-turbo via OpenRouter for recipe generation

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
    ```
    OPENROUTER_API_KEY=your_api_key_here
    PORT=4000
    ```

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
  - IngredientsInput component functionality and validation
  - RecipeList component rendering with mock data
  - Form element presence and structure
  - User interface element accessibility

### Expected Output

When running `npm test`, you should see:
- Backend: 2 tests passing (health endpoint tests)
- Frontend: 17 tests passing (App, IngredientsInput, and RecipeList component tests)
- All tests should exit with code 0

## Project Structure

/README.md
/SPECIFICATION.md
/package.json        # root scripts
/frontend            # Vite + React app
  /src/components    # React components
    IngredientsInput.tsx  # Comma-separated ingredient input with validation
    RecipeList.tsx        # Recipe display with cards, ingredients, and steps
  /src/types         # TypeScript type definitions
    Recipe.ts             # Recipe interface and API types
/backend             # Express + TypeScript API

## Core Components

### IngredientsInput
- Controlled text input for comma-separated ingredients
- Real-time validation and parsing
- Loading states and disabled states during API calls
- Responsive design with modern styling

### RecipeList
- Card-based layout for recipe display
- Shows recipe title, ingredients list, and step-by-step instructions
- Action buttons for refining and favoriting recipes
- Star rating system (1-5 stars)
- Loading spinner during API calls
- Responsive grid layout
