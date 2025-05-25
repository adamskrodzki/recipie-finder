# AI-Assisted Recipe Finder – Product Specification

## 1. Overview
This web app enables users to quickly generate, refine, and save cooking recipes based on a list of ingredients. An AI model (via OpenRouter) produces human-readable recipes.

## 2. User Stories
1. As a cook, I want to enter the ingredients I have so I can get recipe ideas.  
2. As a user, I want to see each recipe's title, ingredients, and steps clearly laid out.  
3. As a user, I want to refine any recipe with custom instructions (e.g., dietary adjustments).  
4. As a user, I want to favorite and rate recipes to revisit my best finds.  
5. As a user, I want a dedicated view to browse my saved favorites.

## 3. Functional Requirements

### 3.1 Ingredient Input & Search
- A form on the home page accepts a comma-separated list or tag inputs of ingredients.
- On submission, the app calls the AI backend to generate exactly 3 recipes.

### 3.2 Recipe Display
- Display each recipe in a card:
  - Recipe Title
  - Ingredients list
  - Step-by-step instructions
- Cards include "Refine", "Favorite", and star-rating controls.

### 3.3 Recipe Refinement
- Clicking "Refine" opens a modal:
  - Text field for user instruction (e.g., "Make it vegan").
- On submit, send the original recipe + instruction to the backend.
- Replace or append the refined recipe in the UI.

### 3.4 Favorites & Ratings
- "Favorite" toggles save/unsave; "Rate" sets 1–5 stars.
- Persist favorites and ratings in browser localStorage.

### 3.5 Favorites View
- A separate "Favorites" page lists saved recipes.
- Display each recipe's title, rating, and a "Remove" action.

### 3.6 Loading & Error States
- While awaiting AI responses, show a spinner or skeleton UI.
- On network or AI errors, display a user-friendly error banner with retry option.

## 4. API Endpoints

### 4.1 POST /api/recipes
**Description:** Generate recipes based on provided ingredients.

**Request:**
```json
{
  "ingredients": ["tomato", "pasta", "cheese", "basil"]
}
```

**Response:** HTTP 200 OK
```json
[
  {
    "id": "r1",
    "title": "Quick Pasta Primavera",
    "ingredients": [
      "2 cups pasta",
      "1 cup mixed vegetables",
      "2 tbsp olive oil",
      "1/4 cup parmesan cheese",
      "Salt and pepper to taste"
    ],
    "steps": [
      "Boil pasta according to package directions",
      "Heat olive oil in a large pan",
      "Sauté vegetables until tender",
      "Add cooked pasta to the pan",
      "Toss with parmesan cheese",
      "Season with salt and pepper"
    ]
  },
  {
    "id": "r2",
    "title": "Simple Stir Fry",
    "ingredients": [
      "2 cups mixed vegetables",
      "2 tbsp soy sauce",
      "1 tbsp vegetable oil",
      "1 tsp garlic powder",
      "1 cup cooked rice"
    ],
    "steps": [
      "Heat oil in a wok or large pan",
      "Add vegetables and stir-fry for 3-4 minutes",
      "Add soy sauce and garlic powder",
      "Cook for another 2 minutes",
      "Serve over rice"
    ]
  }
]
```

**Schema:**
- `id`: Unique string identifier for the recipe
- `title`: Human-readable recipe name
- `ingredients`: Array of ingredient strings with quantities
- `steps`: Array of instruction strings in sequential order

