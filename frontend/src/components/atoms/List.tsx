import './List.css';

interface ListProps {
  items: string[];
  ordered?: boolean;
  className?: string;
}

export const List: React.FC<ListProps> = ({
  items,
  ordered = false,
  className = '',
}) => {
  const ListComponent = ordered ? 'ol' : 'ul';
  const listClass = `list ${ordered ? 'list--ordered' : 'list--unordered'} ${className}`.trim();

  return (
    <ListComponent className={listClass}>
      {items.map((item, index) => (
        <li key={index} className="list__item">
          {item}
        </li>
      ))}
    </ListComponent>
  );
};

// Specialized components
export const IngredientsList: React.FC<{ items: string[] }> = ({ items }) => (
  <List items={items} className="list--ingredients" />
);

export const StepsList: React.FC<{ items: string[] }> = ({ items }) => (
  <List items={items} ordered className="list--steps" />
); 