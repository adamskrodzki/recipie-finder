# AI-Assisted Recipe Finder – Product Specification

## 1. Overview
This web app enables users to quickly generate, refine, and save cooking recipes based on a list of ingredients. An AI model (via OpenRouter) produces human-readable recipes.

## 2. User Stories
1. As a cook, I want to enter the ingredients I have so I can get recipe ideas.  
2. As a user, I want to see each recipe's title, ingredients, and steps clearly laid out.  
3. As a user, I want to refine any recipe with custom instructions (e.g., dietary adjustments).  
4. As a user, I want to favorite and rate recipes to revisit my best finds.  
5. As a user, I want a dedicated view to browse my saved favorites.
6. As a user, I want to specify and manage a list of ingredients in my "Pantry" which I frequently have on hand.

## 3. Functional Requirements

### 3.1 Ingredient Input & Search
- A form on the home page accepts a comma-separated list or tag inputs of ingredients.
- On submission, the app calls the AI backend to generate exactly 3 recipes.
- The backend uses OpenRouter API with GPT-3.5-turbo to generate recipes via structured tool calling.

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
- Persist pantry contents in browser localStorage.

### 3.5 Favorites View
- A separate "Favorites" page lists saved recipes.
- Display each recipe's title, rating, and a "Remove" action.

### 3.6 Loading & Error States
- While awaiting AI responses, show a spinner or skeleton UI.
- On network or AI errors, display a user-friendly error banner with retry option.

### 3.7 Pantry View
- A separate "Pantry" page lists the ingredients the user has specified.
- Users can add, edit, and remove ingredients from their pantry list.
- Ingredients in the pantry should be automatically included as part of the ingredient list when generating recipes, in addition to any ingredients the user explicitly enters for a search.

