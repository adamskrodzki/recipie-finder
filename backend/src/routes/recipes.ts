import { Request, Response } from 'express';
import { RecipeRequest } from '../types';
import { stubbedRecipes } from '../data/stubbed-recipes';

export const getRecipes = (req: Request, res: Response) => {
  const { ingredients }: RecipeRequest = req.body;
  
  // For now, return all stubbed recipes regardless of ingredients
  // In the future, this will call the AI service to generate recipes
  res.status(200).json(stubbedRecipes);
}; 