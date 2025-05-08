// src/components/Sidebar.jsx
import React from 'react';
import FilterGroup from './FilterGroup';

export default function Sidebar({
  filters,
  activeFilters,
  onToggle,
  onClear,
  photosCount        // ← accept the new prop
}) {
  return (
    <aside className="w-58 bg-gray-200 flex flex-col">
      {/* Clear button wrapper */}
      <div className="p-4">
        <button
          onClick={onClear}
          className="
          w-full px-4 py-2 
          bg-gray-300 rounded hover:bg-gray-300 
          hover:scale-106
          transition-all duration-100 ease-in-out transform 
          font-FuturaPTMedium text-lg text-[rgb(1,44,95)]"
        >
          Clear All Filters
        </button>

        {/* Photo count display */}
        <div className="mt-2 text-xlg font-FuturaPTMedium text-[rgb(1,44,95)]">
          {photosCount} photo{photosCount !== 1 ? 's' : ''} filtered
        </div>
      </div>

      {/* Scrollable filter groups */}
      <div className="flex-1 overflow-auto">
        <div className="px-4">
          {Object.entries(filters)
            .filter(([, items]) => items.length)
            .map(([group, items]) => (
              <FilterGroup
                key={group}
                group={group}
                items={items}
                active={activeFilters[group] || []}
                onToggle={val => onToggle(group, val)}
              />
            ))}
        </div>
      </div>
    </aside>
  );
}
