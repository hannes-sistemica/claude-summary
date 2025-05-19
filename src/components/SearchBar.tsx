import React, { useState, useRef } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { SearchBarProps, DateFilter } from '../lib/types';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, dateFilter, onDateFilterChange }) => {
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term.trim());
  };
  
  const handleClear = () => {
    setTerm('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDateChange = (field: keyof DateFilter, value: string) => {
    onDateFilterChange({
      ...dateFilter,
      [field]: value || null
    });
  };
  
  const clearDateFilter = () => {
    onDateFilterChange({ startDate: null, endDate: null });
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-gray-400 pointer-events-none">
            <Search className="h-5 w-5" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="block w-full pl-10 pr-20 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Search conversations..."
          />
          
          <div className="absolute right-0 flex h-full">
            {term && (
              <button
                type="button"
                onClick={handleClear}
                className="h-full px-3 text-white bg-red-500 hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <button
              type="submit"
              className="h-full px-4 text-white bg-green-500 hover:bg-green-600 transition-colors rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <Calendar className="h-5 w-5 text-gray-400" />
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              id="startDate"
              value={dateFilter.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              id="endDate"
              value={dateFilter.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              min={dateFilter.startDate || undefined}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        {(dateFilter.startDate || dateFilter.endDate) && (
          <button
            onClick={clearDateFilter}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear date filter"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;