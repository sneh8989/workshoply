import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterSidebar = ({
  filters,
  onChange,
  onReset
}) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value, page: 1 });
  };

  return (
    <aside className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-main">
          <Filter className="w-4 h-4 text-secondary" />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-muted hover:text-secondary flex items-center gap-1 font-medium transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Sort Option */}
      <div>
        <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={filters.sort || 'date_asc'}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="w-full text-xs font-medium bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="date_asc">Upcoming Date (Earliest first)</option>
          <option value="date_desc">Upcoming Date (Latest first)</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Delivery Mode */}
      <div>
        <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2">
          Format
        </label>
        <div className="space-y-1.5 text-xs font-medium text-muted">
          {[
            { label: 'All Formats', value: 'ALL' },
            { label: 'Online Masterclass', value: 'ONLINE' },
            { label: 'In-Person Workshop', value: 'IN_PERSON' },
            { label: 'Hybrid Cohort', value: 'HYBRID' }
          ].map((mode) => (
            <label key={mode.value} className="flex items-center gap-2 cursor-pointer hover:text-main">
              <input
                type="radio"
                name="deliveryMode"
                value={mode.value}
                checked={(filters.deliveryMode || 'ALL') === mode.value}
                onChange={(e) => handleChange('deliveryMode', e.target.value)}
                className="text-secondary focus:ring-secondary"
              />
              <span>{mode.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skill Level */}
      <div>
        <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2">
          Skill Level
        </label>
        <select
          value={filters.skillLevel || 'ALL_LEVELS'}
          onChange={(e) => handleChange('skillLevel', e.target.value)}
          className="w-full text-xs font-medium bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL_LEVELS">All Levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2">
          City (In-Person)
        </label>
        <input
          type="text"
          value={filters.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="e.g. Bengaluru, Mumbai, Delhi"
          className="w-full text-xs bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted"
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-muted">Min (₹)</span>
            <input
              type="number"
              min="0"
              value={filters.minPrice !== undefined ? filters.minPrice : ''}
              onChange={(e) => handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0"
              className="w-full text-xs bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted">Max (₹)</span>
            <input
              type="number"
              min="0"
              value={filters.maxPrice !== undefined ? filters.maxPrice : ''}
              onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="5000"
              className="w-full text-xs bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
