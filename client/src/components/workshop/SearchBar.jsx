import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ onSearch, initialValue = '', placeholder = 'Search by title, instructor, or topic...' }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-3.5 bg-surface border border-border rounded-xl shadow-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder:text-muted transition"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 p-1.5 text-muted hover:text-main"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 btn-primary text-xs px-4 py-2"
        >
          Search
        </button>
      </div>
    </form>
  );
};
