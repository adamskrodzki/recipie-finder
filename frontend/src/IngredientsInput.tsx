/* global HTMLInputElement */
import React, { useState } from 'react';

interface IngredientsInputProps {
  onSubmit: (ingredients: string[]) => void;
}

const IngredientsInput: React.FC<IngredientsInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit(ingredients);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter ingredients, comma-separated"
        value={input}
        onChange={handleChange}
        data-testid="ingredients-input"
      />
      <button type="submit" data-testid="find-recipes-btn">Find Recipes</button>
    </form>
  );
};

export default IngredientsInput;
