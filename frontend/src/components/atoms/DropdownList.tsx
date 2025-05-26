import React from 'react';
import './DropdownList.css';

export interface DropdownListItem {
  id: string;
  label: string;
}

interface DropdownListProps {
  items: DropdownListItem[];
  onItemSelect: (item: DropdownListItem) => void;
  isLoading?: boolean;
  className?: string;
  emptyMessage?: string;
  highlightedIndex?: number;
  assignItemRef?: (element: HTMLLIElement | null, index: number) => void;
  listId?: string;
}

export const DropdownList: React.FC<DropdownListProps> = ({
  items,
  onItemSelect,
  isLoading = false,
  className = '',
  emptyMessage = 'No results found',
  highlightedIndex,
  assignItemRef,
  listId = 'ingredient-suggestions-listbox',
}) => {
  const baseClass = 'dropdown-list';
  const dropdownClass = `${baseClass} ${className}`.trim();

  return (
    <div className={dropdownClass}>
      {isLoading && <div className={`${baseClass}__loading`}>Loading...</div>}
      {!isLoading && items.length === 0 && (
        <div className={`${baseClass}__empty`}>{emptyMessage}</div>
      )}
      {!isLoading && items.length > 0 && (
        <ul className={`${baseClass}__items`} id={listId} role="listbox">
          {items.map((item, index) => (
            <li
              key={item.id}
              ref={el => assignItemRef && assignItemRef(el, index)}
              className={`${baseClass}__item ${
                index === highlightedIndex ? `${baseClass}__item--highlighted` : ''
              }`.trim()}
              onClick={() => onItemSelect(item)}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex={-1}
              role="option"
              aria-selected={index === highlightedIndex}
              id={`${baseClass}__item--${item.id}`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 