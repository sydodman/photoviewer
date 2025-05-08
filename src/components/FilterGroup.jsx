// src/components/FilterGroup.jsx
import React from 'react';

export default function FilterGroup({ group, items, active, onToggle }) {
  // Tailwind width classes you can tweak per group:
  const WIDTH_MAP = {
    Year:  'w-16',  // e.g. 5rem
    Event: 'w-20',  // e.g. 6rem
    Day:   'w-14',  // e.g. 4rem
    Team:  'w-14',  // e.g. 7rem
    Misc:  'w-26'   // e.g. 8rem
  };
  // Single height for every button; adjust as needed:
  const HEIGHT_CLASS = 'h-8'; // e.g. 2rem

  // fallback if you add new groups:
  const widthClass = WIDTH_MAP[group] || 'w-24';

  return (
    <div className="mb-4">
      <h3 className="font-FuturaPTMedium text-lg mb-2 text-[rgb(1,44,95)]">{group}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const isActive = active.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`
                ${widthClass} ${HEIGHT_CLASS}
                flex items-center justify-center
                rounded-full border
                font-FuturaPTMedium
                text-base
                text-[rgb(1,44,95)]
                ${isActive ? 'bg-[rgb(1,44,95)] text-white' : 'bg-white'}
              `}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
