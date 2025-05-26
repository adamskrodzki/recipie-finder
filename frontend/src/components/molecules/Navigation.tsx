import { Link, useLocation } from 'react-router-dom';
import { useRecipeStorage } from '../../hooks/useRecipeStorage';
import { Button } from '../atoms/Button';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { favorites } = useRecipeStorage();
  
  const isHome = location.pathname === '/';
  const isFavorites = location.pathname === '/favorites';
  const isPantry = location.pathname === '/pantry';

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__brand">
          <Link to="/" className="navigation__brand-link">
            <h2 className="navigation__title">Recipe Finder</h2>
          </Link>
        </div>
        
        <div className="navigation__menu">
          <Link to="/">
            <Button
              variant={isHome ? 'primary' : 'secondary'}
              size="medium"
            >
              Find Recipes
            </Button>
          </Link>
          
          <Link to="/favorites">
            <Button
              variant={isFavorites ? 'primary' : 'secondary'}
              size="medium"
            >
              My Favorites {favorites.length > 0 && `(${favorites.length})`}
            </Button>
          </Link>
          
          <Link to="/pantry">
            <Button
              variant={isPantry ? 'primary' : 'secondary'}
              size="medium"
            >
              My Pantry
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}; 