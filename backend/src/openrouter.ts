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

  async generateRecipes(ingredients: string[]): Promise<Recipe[]> {
    // Define the tool for structured recipe generation
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'generate_recipes',
          description: 'Generate exactly 3 unique recipes using the provided ingredients',
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
                    }
                  },
                  required: ['id', 'title', 'ingredients', 'steps']
                },
                minItems: 3,
                maxItems: 3,
                description: 'Array of exactly 3 unique recipes'
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
          content: `You are an expert chef and recipe creator. Your task is to generate creative, practical, and delicious recipes based on provided ingredients.

Guidelines:
- Each recipe must use all of the provided ingredients
- Include additional common pantry ingredients as needed
- Provide clear, step-by-step instructions that are easy to follow
- Prefer simple recipies over complex, best taste with minimum effort,
- Make recipes suitable for home cooking with standard kitchen equipment
- Ensure recipes are from different cuisines or cooking styles for variety
- Use proper cooking terminology and techniques`
        },
        {
          role: 'user',
          content: 'Generate 3 recipes using: chicken, tomatoes, onions'
        },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_example',
              type: 'function',
              function: {
                name: 'generate_recipes',
                arguments: JSON.stringify({
                  recipes: [
                    {
                      id: '1',
                      title: 'Mediterranean Chicken Skillet',
                      ingredients: ['chicken breast', 'tomatoes', 'onions', 'olive oil', 'garlic', 'oregano', 'feta cheese', 'salt', 'pepper'],
                      steps: [
                        'Heat olive oil in a large skillet over medium-high heat',
                        'Season chicken breast with salt and pepper, then cook for 6-7 minutes per side until golden',
                        'Remove chicken and set aside, add sliced onions to the same pan',
                        'Cook onions for 3-4 minutes until softened, add minced garlic',
                        'Add diced tomatoes and oregano, simmer for 5 minutes',
                        'Return chicken to pan, top with crumbled feta cheese',
                        'Cover and cook for 2-3 minutes until cheese is slightly melted'
                      ]
                    },
                    {
                      id: '2',
                      title: 'Hearty Chicken and Tomato Soup',
                      ingredients: ['chicken thighs', 'tomatoes', 'onions', 'chicken broth', 'carrots', 'celery', 'bay leaves', 'thyme', 'salt', 'pepper'],
                      steps: [
                        'In a large pot, brown chicken thighs on all sides, then remove and set aside',
                        'Add diced onions, carrots, and celery to the pot, cook until softened',
                        'Add diced tomatoes and cook for 3 minutes',
                        'Return chicken to pot, add chicken broth, bay leaves, and thyme',
                        'Bring to a boil, then reduce heat and simmer for 25-30 minutes',
                        'Remove chicken, shred the meat, and return to pot',
                        'Season with salt and pepper, simmer for 5 more minutes'
                      ]
                    },
                    {
                      id: '3',
                      title: 'Baked Chicken with Tomato-Onion Topping',
                      ingredients: ['chicken drumsticks', 'tomatoes', 'onions', 'balsamic vinegar', 'honey', 'rosemary', 'garlic powder', 'olive oil', 'salt', 'pepper'],
                      steps: [
                        'Preheat oven to 400°F (200°C)',
                        'Season chicken drumsticks with salt, pepper, and garlic powder',
                        'Place chicken in a baking dish and drizzle with olive oil',
                        'In a bowl, mix sliced tomatoes and onions with balsamic vinegar and honey',
                        'Top chicken with the tomato-onion mixture and fresh rosemary',
                        'Bake for 35-40 minutes until chicken is cooked through',
                        'Let rest for 5 minutes before serving'
                      ]
                    }
                  ]
                })
              }
            }
          ]
        },
        {
          role: 'tool',
          tool_call_id: 'call_example',
          content: 'Successfully generated 3 diverse chicken recipes using the provided ingredients.'
        },
        {
          role: 'user',
          content: `Generate 3 recipes using these ingredients: ${ingredients.join(', ')}`
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
      if (!Array.isArray(recipes) || recipes.length !== 3) {
        throw new Error('Invalid response format: expected array of 3 recipes');
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
} 