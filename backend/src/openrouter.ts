import OpenAI from 'openai';
import { Recipe } from './types';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class OpenRouterService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });
  }

  async generateRecipes(ingredients: string[], mealType?: string): Promise<Recipe[]> {
    console.log('Generating recipes with ingredients:', ingredients, 'and meal type:', mealType);
    // Define the tool for structured recipe generation
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'generate_recipes',
          description: 'Generate exactly 3 unique recipes using the provided ingredients and meal type suggestion',
          parameters: {
            type: 'object',
            properties: {
              recipes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Unique identifier for the recipe (1, 2, or 3)'
                    },
                    title: {
                      type: 'string',
                      description: 'Descriptive name of the recipe'
                    },
                    ingredients: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'List of all ingredients needed for the recipe'
                    },
                    steps: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Step-by-step cooking instructions'
                    },
                    mealType: {
                      type: 'string',
                      description: 'Suggested meal type for the recipe (breakfast, lunch, dinner, snack, dessert)'
                    }
                  },
                  required: ['id', 'title', 'ingredients', 'steps', 'mealType']
                },
                minItems: 3,
                maxItems: 3,
                description: 'Array of exactly 3 unique recipes inline with ingredients and meal type suggestion'
              }
            },
            required: ['recipes']
          }
        }
      }
    ];

    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are an expert chef and recipe creator. Your task is to generate creative, practical, and delicious recipes based on provided ingredients and meal type request.

Guidelines:
- Each recipe must use all of the provided ingredients
- Include additional common pantry ingredients as needed
- Provide clear, step-by-step instructions that are easy to follow
- Prefer simple recipies over complex, best taste with minimum effort,
- Make recipes suitable for home cooking with standard kitchen equipment
- Ensure recipes are from different cuisines or cooking styles for variety
- when meal type is provided, make sure the recipes are inline with the meal type
- Use proper cooking terminology and techniques`
        },
        {
          role: 'user',
          content: 'Generate 3 recipes using these ingredients: chicken, carrots for breakfast'
        },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_4QkEnC1oBnCxUqDMbK6Nosm8',
              type: 'function',
              function: {
                name: 'generate_recipes',
                arguments: JSON.stringify({
                  recipes: [
                    {
                      id: '1',
                      title: 'Chicken-Carrot Breakfast Hash',
                      ingredients: [
                        '1 cup cooked chicken breast, diced',
                        '1 large carrot, diced',
                        '1 medium potato, diced (skin on)',
                        '½ small onion, diced',
                        '½ bell pepper, diced',
                        '2 tbsp olive oil',
                        '½ tsp smoked paprika',
                        'salt',
                        'pepper',
                        '2 eggs (optional, for serving)'
                      ],
                      steps: [
                        'Heat olive oil in a large skillet over medium-high heat.',
                        'Add diced potato and cook, stirring occasionally, until lightly browned, about 5 minutes.',
                        'Stir in onion, bell pepper, and carrot; sauté until vegetables soften slightly, 4-5 minutes.',
                        'Add diced chicken, smoked paprika, salt, and pepper; cook until chicken is heated through and carrots are tender, 3-4 minutes more.',
                        'Taste and adjust seasoning. If using eggs, push hash to one side of skillet, crack eggs into the space, cover, and cook to desired doneness.',
                        'Serve hot straight from the pan.'
                      ],
                      mealType: 'breakfast'
                    },
                    {
                      id: '2',
                      title: 'Ginger Chicken & Carrot Congee',
                      ingredients: [
                        '¾ cup jasmine or short-grain rice, rinsed',
                        '6 cups chicken broth',
                        '1 cup raw chicken thigh, thinly sliced',
                        '1 medium carrot, julienned',
                        '1-inch knob fresh ginger, sliced',
                        '1 clove garlic, minced',
                        '1 tbsp soy sauce',
                        '1 tsp sesame oil',
                        'salt',
                        'white pepper',
                        '2 scallions, sliced (for garnish)'
                      ],
                      steps: [
                        'In a medium saucepan combine rice, chicken broth, ginger, and garlic; bring to a boil.',
                        'Reduce heat to low, partially cover, and simmer 25-30 minutes, stirring occasionally, until rice breaks down and porridge thickens.',
                        'Add sliced chicken and julienned carrot; cook, stirring, until chicken is no longer pink and carrot is tender, about 6-8 minutes.',
                        'Season with soy sauce, sesame oil, salt, and white pepper to taste.',
                        'Ladle into bowls and garnish with sliced scallions.'
                      ],
                      mealType: 'breakfast'
                    },
                    {
                      id: '3',
                      title: 'Mediterranean Chicken & Carrot Egg Muffins',
                      ingredients: [
                        '1 cup cooked chicken, shredded',
                        '1 medium carrot, grated',
                        '6 large eggs',
                        '½ cup fresh spinach, chopped',
                        '¼ cup crumbled feta cheese',
                        '2 tbsp milk',
                        '½ tsp dried oregano',
                        '¼ tsp garlic powder',
                        'salt',
                        'pepper',
                        'olive oil or cooking spray (for tin)'
                      ],
                      steps: [
                        'Preheat oven to 190 °C / 375 °F. Lightly grease a 12-cup muffin tin with olive oil or cooking spray.',
                        'In a mixing bowl whisk eggs with milk, oregano, garlic powder, salt, and pepper.',
                        'Fold in shredded chicken, grated carrot, spinach, and feta.',
                        'Divide mixture evenly among muffin cups, filling each about ¾ full.',
                        'Bake 15-18 minutes, or until centers are set and tops are lightly golden.',
                        'Cool 2 minutes, run a knife around edges, and lift out. Serve warm or at room temperature.'
                      ],
                      mealType: 'breakfast'
                    }
                  ]
                })
              }
            }
          ]
        },
        {
          role: 'tool',
          tool_call_id: 'call_4QkEnC1oBnCxUqDMbK6Nosm8',
          content: 'Successfully generated 3 diverse chicken recipes using the provided ingredients.'
        },
        {
          role: 'user',
          content: `Generate 3 recipes using these ingredients: ${ingredients.join(', ')} for ${mealType || 'any meal'}`
        }
      ];

      const requestPayload = {
        model: 'openai/gpt-4.1-nano',
        messages: messages,
        tools: tools,
        tool_choice: { type: 'function' as const, function: { name: 'generate_recipes' } }
      };

      const requestOptions = {
        headers: {
          'HTTP-Referer': 'https://recipe-finder.local',
          'X-Title': 'AI Recipe Finder'
        }
      };

      // Log the request payload
      console.log('=== OPENROUTER API REQUEST ===');
      console.log('URL: https://openrouter.ai/api/v1/chat/completions');
      console.log('Model:', requestPayload.model);
      console.log('Messages count:', requestPayload.messages.length);
      console.log('Tools:', JSON.stringify(requestPayload.tools, null, 2));
      console.log('Tool choice:', JSON.stringify(requestPayload.tool_choice, null, 2));
      console.log('Headers:', JSON.stringify(requestOptions.headers, null, 2));
      console.log('User message:', requestPayload.messages[requestPayload.messages.length - 1].content);
      console.log('=== END REQUEST ===');

      const completion = await this.client.chat.completions.create(requestPayload, requestOptions);

      // Log the response
      console.log('=== OPENROUTER API RESPONSE ===');
      console.log('Response ID:', completion.id);
      console.log('Model:', completion.model);
      console.log('Usage:', JSON.stringify(completion.usage, null, 2));
      console.log('Choices count:', completion.choices.length);
      console.log('Finish reason:', completion.choices[0]?.finish_reason);
      console.log('Message role:', completion.choices[0]?.message?.role);
      console.log('Tool calls count:', completion.choices[0]?.message?.tool_calls?.length || 0);
      if (completion.choices[0]?.message?.tool_calls) {
        console.log('Tool calls:', JSON.stringify(completion.choices[0].message.tool_calls, null, 2));
      }
      console.log('=== END RESPONSE ===');

      const message = completion.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        console.error('ERROR: No tool calls received from OpenRouter');
        console.error('Message content:', message?.content);
        throw new Error('No tool calls received from OpenRouter');
      }

      const toolCall = message.tool_calls[0];
      if (toolCall.function.name !== 'generate_recipes') {
        throw new Error('Unexpected tool call received');
      }

      // Parse the tool call arguments
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const recipes = toolArgs.recipes as Recipe[];
      
      // Validate the response structure
      if (!Array.isArray(recipes)) {
        throw new Error('Invalid response format: expected array of recipes');
      }

      // Validate each recipe has required fields
      recipes.forEach((recipe, index) => {
        if (!recipe.id || !recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
          throw new Error(`Invalid recipe structure at index ${index}`);
        }
        if (recipe.ingredients.length === 0 || recipe.steps.length === 0) {
          throw new Error(`Recipe at index ${index} has empty ingredients or steps`);
        }
      });

      return recipes;
    } catch (error) {
      console.error('=== OPENROUTER SERVICE ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        
        // Check if it's an OpenAI API error
        if ('status' in error) {
          console.error('API Status:', (error as any).status);
          console.error('API Error:', (error as any).error);
        }
        
        // Check if it's a network error
        if ('code' in error) {
          console.error('Network error code:', (error as any).code);
        }
      }
      
      console.error('Input ingredients:', ingredients);
      console.error('=== END SERVICE ERROR ===');
      
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse recipe response from AI');
      }
      throw error;
    }
  }

  async refineRecipe(originalRecipe: Recipe, instruction: string): Promise<Recipe> {
    // Define the tool for structured recipe refinement
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'refine_recipe',
          description: 'Refine an existing recipe based on user instructions',
          parameters: {
            type: 'object',
            properties: {
              recipe: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Keep the same ID as the original recipe'
                  },
                  title: {
                    type: 'string',
                    description: 'Updated title that reflects the refinement'
                  },
                  ingredients: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'Updated list of ingredients based on the refinement instruction'
                  },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'Updated step-by-step cooking instructions'
                  }
                },
                required: ['id', 'title', 'ingredients', 'steps']
              }
            },
            required: ['recipe']
          }
        }
      }
    ];

    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are an expert chef and recipe creator. Your task is to refine existing recipes based on user instructions while maintaining the essence and quality of the original recipe.

Guidelines:
- Carefully follow the user's refinement instruction
- Maintain the cooking style and complexity level unless specifically asked to change it
- Ensure the refined recipe is practical and achievable with standard kitchen equipment
- Keep ingredient substitutions reasonable and accessible
- Preserve the original recipe ID
- Update the title to reflect any significant changes
- Provide clear, step-by-step instructions that incorporate the refinement`
        },
        {
          role: 'user',
          content: `Please refine this recipe based on the following instruction:

Original Recipe:
Title: ${originalRecipe.title}
Ingredients: ${originalRecipe.ingredients.join(', ')}
Steps: ${originalRecipe.steps.join(' | ')}

Refinement Instruction: ${instruction}

Please provide the refined recipe with the same ID (${originalRecipe.id}) but updated according to the instruction.`
        }
      ];

      const requestPayload = {
        model: 'openai/gpt-4.1-nano',
        messages: messages,
        tools: tools,
        tool_choice: { type: 'function' as const, function: { name: 'refine_recipe' } }
      };

      const requestOptions = {
        headers: {
          'HTTP-Referer': 'https://recipe-finder.local',
          'X-Title': 'AI Recipe Finder - Recipe Refinement'
        }
      };

      // Log the request payload
      console.log('=== OPENROUTER RECIPE REFINEMENT REQUEST ===');
      console.log('Original recipe ID:', originalRecipe.id);
      console.log('Original recipe title:', originalRecipe.title);
      console.log('Refinement instruction:', instruction);
      console.log('Model:', requestPayload.model);
      console.log('=== END REFINEMENT REQUEST ===');

      const completion = await this.client.chat.completions.create(requestPayload, requestOptions);

      // Log the response
      console.log('=== OPENROUTER REFINEMENT RESPONSE ===');
      console.log('Response ID:', completion.id);
      console.log('Model:', completion.model);
      console.log('Usage:', JSON.stringify(completion.usage, null, 2));
      console.log('Finish reason:', completion.choices[0]?.finish_reason);
      console.log('=== END REFINEMENT RESPONSE ===');

      const message = completion.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        console.error('ERROR: No tool calls received from OpenRouter for refinement');
        console.error('Message content:', message?.content);
        throw new Error('No tool calls received from OpenRouter for recipe refinement');
      }

      const toolCall = message.tool_calls[0];
      if (toolCall.function.name !== 'refine_recipe') {
        throw new Error('Unexpected tool call received for recipe refinement');
      }

      // Parse the tool call arguments
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const refinedRecipe = toolArgs.recipe as Recipe;
      
      // Validate the response structure
      if (!refinedRecipe || typeof refinedRecipe !== 'object') {
        throw new Error('Invalid refinement response format: expected recipe object');
      }

      // Validate the refined recipe has required fields
      if (!refinedRecipe.id || !refinedRecipe.title || !Array.isArray(refinedRecipe.ingredients) || !Array.isArray(refinedRecipe.steps)) {
        throw new Error('Invalid refined recipe structure: missing required fields');
      }

      if (refinedRecipe.ingredients.length === 0 || refinedRecipe.steps.length === 0) {
        throw new Error('Refined recipe has empty ingredients or steps');
      }

      // Ensure the ID matches the original recipe
      if (refinedRecipe.id !== originalRecipe.id) {
        console.warn('Recipe ID mismatch, correcting to original ID');
        refinedRecipe.id = originalRecipe.id;
      }

      return refinedRecipe;
    } catch (error) {
      console.error('=== OPENROUTER REFINEMENT ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        
        // Check if it's an OpenAI API error
        if ('status' in error) {
          console.error('API Status:', (error as any).status);
          console.error('API Error:', (error as any).error);
        }
      }
      
      console.error('Original recipe:', originalRecipe);
      console.error('Refinement instruction:', instruction);
      console.error('=== END REFINEMENT ERROR ===');
      
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse refined recipe response from AI');
      }
      throw error;
    }
  }
} 