import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { workshopApi } from '../api/workshop.api';
import { WorkshopGrid } from '../components/workshop/WorkshopGrid';
import { SearchBar } from '../components/workshop/SearchBar';
import { CategoryChips } from '../components/workshop/CategoryChips';
import { FilterSidebar } from '../components/workshop/FilterSidebar';
import { Pagination } from '../components/common/Pagination';
import { SlidersHorizontal, X } from 'lucide-react';

export const WorkshopDiscoveryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workshops, setWorkshops] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract filters from URL query parameters
  const currentFilters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All',
    deliveryMode: searchParams.get('deliveryMode') || 'ALL',
    skillLevel: searchParams.get('skillLevel') || 'ALL_LEVELS',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: searchParams.get('sort') || 'date_asc',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1
  };

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'All' && value !== 'ALL' && value !== 'ALL_LEVELS') {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const fetchWorkshops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiParams = { ...currentFilters };
      if (apiParams.category === 'All') delete apiParams.category;
      if (apiParams.deliveryMode === 'ALL') delete apiParams.deliveryMode;
      if (apiParams.skillLevel === 'ALL_LEVELS') delete apiParams.skillLevel;
      if (!apiParams.search) delete apiParams.search;
      if (!apiParams.city) delete apiParams.city;

      const res = await workshopApi.getWorkshops(apiParams);
      setWorkshops(res.data || []);
      setPagination(res.meta || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load workshops:', err);
      setError(err.response?.data?.message || 'Unable to retrieve workshops. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
    // Scroll smoothly to top on page or filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Title */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Masterclasses & Bootcamps
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
            Discover Workshops
          </h1>
          <p className="text-sm text-muted mt-1">
            Explore {pagination.total || 'our'} verified cohorts and level up with senior industry mentors.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <SearchBar
            initialValue={currentFilters.search}
            onSearch={(val) => updateFilters({ ...currentFilters, search: val, page: 1 })}
          />

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="md:hidden w-full sm:w-auto btn-outline text-xs flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Refine Filters</span>
          </button>
        </div>

        {/* Quick Category Chips */}
        <CategoryChips
          selectedCategory={currentFilters.category}
          onSelectCategory={(cat) => updateFilters({ ...currentFilters, category: cat, page: 1 })}
        />
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:col-span-1">
          <FilterSidebar
            filters={currentFilters}
            onChange={updateFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Filters Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm md:hidden flex justify-end">
            <div className="w-80 bg-surface h-full p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-main">Filter Options</span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-muted hover:text-main"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSidebar
                filters={currentFilters}
                onChange={(f) => {
                  updateFilters(f);
                  setIsMobileFilterOpen(false);
                }}
                onReset={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Workshops Listing Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Showing <strong className="text-main">{workshops.length}</strong> of{' '}
              <strong className="text-main">{pagination.total}</strong> workshops
            </span>
          </div>

          <WorkshopGrid
            workshops={workshops}
            isLoading={isLoading}
            error={error}
            onRetry={fetchWorkshops}
            emptyActionText="Reset All Filters"
            onEmptyAction={handleResetFilters}
          />

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(page) => updateFilters({ ...currentFilters, page })}
          />
        </div>
      </div>
    </div>
  );
};
