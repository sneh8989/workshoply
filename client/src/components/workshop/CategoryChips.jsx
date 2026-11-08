import React from 'react';

const CATEGORIES = [
  'All',
  'Web Development',
  'Artificial Intelligence',
  'UI/UX Design',
  'Data Science',
  'Digital Marketing',
  'Entrepreneurship',
  'Photography',
  'Personal Development'
];

export const CategoryChips = ({ selectedCategory = 'All', onSelectCategory }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isSelected
                ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                : 'bg-surface text-muted border border-border hover:border-stone-400 hover:text-main'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
