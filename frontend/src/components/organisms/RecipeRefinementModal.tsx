import React, { useState } from 'react';
import { Modal } from '../atoms/Modal';
import { Textarea } from '../atoms/Textarea';
import { Button } from '../atoms/Button';
import type { Recipe } from '../../types/Recipe';
import './RecipeRefinementModal.css';

interface RecipeRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  onRefine: (recipe: Recipe, instruction: string) => Promise<void>;
  isLoading?: boolean;
}

export const RecipeRefinementModal: React.FC<RecipeRefinementModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onRefine,
  isLoading = false
}) => {
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!recipe) return;
    
    if (!instruction.trim()) {
      setError('Please provide refinement instructions');
      return;
    }

    try {
      setError(null);
      await onRefine(recipe, instruction.trim());
      setInstruction('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine recipe');
    }
  };

  const handleClose = () => {
    setInstruction('');
    setError(null);
    onClose();
  };

  if (!recipe) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Refine "${recipe.title}"`}
      size="large"
    >
      <div className="recipe-refinement-modal">
        <div className="recipe-refinement-modal__original">
          <h4 className="recipe-refinement-modal__section-title">Original Recipe</h4>
          <div className="recipe-refinement-modal__recipe-preview">
            <div className="recipe-refinement-modal__ingredients">
              <h5>Ingredients:</h5>
              <ul>
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>
            <div className="recipe-refinement-modal__steps">
              <h5>Steps:</h5>
              <ol>
                {recipe.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="recipe-refinement-modal__form">
          <div className="recipe-refinement-modal__field">
            <label className="recipe-refinement-modal__label">
              Refinement Instructions
              <span className="recipe-refinement-modal__required">*</span>
            </label>
            <Textarea
              value={instruction}
              onChange={setInstruction}
              placeholder="Describe how you'd like to modify this recipe. For example:
- Make it vegetarian
- Add more spices
- Reduce cooking time
- Make it healthier
- Change the cooking method"
              rows={6}
              disabled={isLoading}
              required
              maxLength={500}
            />
            {error && (
              <div className="recipe-refinement-modal__error">
                {error}
              </div>
            )}
          </div>

          <div className="recipe-refinement-modal__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !instruction.trim()}
            >
              {isLoading ? 'Refining...' : 'Refine Recipe'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}; 