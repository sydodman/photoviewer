// src/components/Sidebar.jsx
import React, { useState } from 'react';
import FilterGroup from './FilterGroup';

export default function Sidebar({
  filters,
  activeFilters,
  onToggle,
  onClear,
  photosCount,
  moreLikeThisPhoto,
  onClearMoreLikeThis,
  sliderValue,
  onSliderChange,
  isLoadingSimilar
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

        {/* More like this thumbnail */}
        {moreLikeThisPhoto && (
          <div className="mt-3 relative">
            <div className="relative w-full rounded overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(1,44,95,0.10)' }}>
              <img 
                src={moreLikeThisPhoto.thumbnailUrl} 
                alt="More like this" 
                className="w-full h-auto"
                style={{ 
                  aspectRatio: 'auto',
                  objectFit: 'contain'
                }}
              />
              {/* Close button */}
              <button
                onClick={onClearMoreLikeThis}
                aria-label="Close"
                className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full focus:outline-none transition-all duration-100 z-10 border-2"
                style={{
                  background: 'white',
                  borderColor: 'rgb(1,44,95)',
                  boxShadow: '0 2px 8px rgba(1,44,95,0.10)',
                  cursor: 'pointer',
                  padding: 0
                }}
                onMouseOver={e => e.currentTarget.style.background = '#9ca3af'} // Match scrollbar/slider hover color
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 14 14" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block' }}
                >
                  <path 
                    d="M2.5 2.5L11.5 11.5M2.5 11.5L11.5 2.5" 
                    stroke="rgb(1,44,95)" 
                    strokeWidth="1.75" 
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            
            {/* Slider */}
            <div className="mt-2 w-full px-1">
              <style>
                {`
                  .custom-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: #d1d5db; /* Darker gray for better contrast */
                    outline: none;
                    opacity: 1;
                    transition: opacity 0.2s;
                    cursor: pointer;
                    border: 1px solid #9ca3af; /* Border to make it stand out */
                  }
                  .custom-slider:hover {
                    background: #9ca3af; /* Even darker on hover */
                  }
                  .custom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: rgb(1,44,95);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  }
                  .custom-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: rgb(1,44,95);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  }
                  /* Track styling for Firefox */
                  .custom-slider::-moz-range-track {
                    background: #d1d5db;
                    border: 1px solid #9ca3af;
                    height: 8px;
                    border-radius: 4px;
                  }
                `}
              </style>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => onSliderChange(parseInt(e.target.value, 10))}
                className="custom-slider"
                disabled={isLoadingSimilar}
              />
            </div>
          </div>
        )}

        {/* Photo count display */}
        <div className="mt-2 text-xlg font-FuturaPTMedium text-[rgb(1,44,95)]">
          {photosCount} photo{photosCount !== 1 ? 's' : ''} filtered
        </div>
      </div>

      {/* Custom scrollbar styling */}
      <style>
        {`
          /* Custom scrollbar styling */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px; /* Match UI slider height */
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #e5e7eb; /* Match sidebar bg-gray-200 */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db; /* Match UI slider background color */
            border-radius: 5px;
            border: 1px solid #9ca3af; /* Match UI slider border */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af; /* Match UI slider hover color */
          }
        `}
      </style>
      
      {/* Scrollable filter groups */}
      <div className="flex-1 overflow-auto custom-scrollbar">
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
