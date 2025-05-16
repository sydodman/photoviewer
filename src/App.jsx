// src/App.jsx
import React, { useState, useEffect } from 'react';
import Banner        from './components/Banner';
import Sidebar       from './components/Sidebar';
import ThumbnailGrid from './components/ThumbnailGrid';
import { FILTERS_URL, PHOTOS_URL } from './config';

// Custom order for days of the week
const DAY_ORDER = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function App() {
  const [activeFilters, setActiveFilters] = useState({
    Year: [], Event: [], Day: [], Team: [], Misc: []
  });
  const [filterOptions, setFilterOptions] = useState({
    Year: [], Event: [], Day: [], Team: [], Misc: []
  });
  const [photos, setPhotos] = useState([]);
  const [moreLikeThisPhoto, setMoreLikeThisPhoto] = useState(null);

  // 1) Load Year options on mount
  useEffect(() => {
    fetch(FILTERS_URL)
      .then(res => res.json())
      .then(data => setFilterOptions(opts => ({
        ...opts,
        Year: data.Year?.filter(v => v.toLowerCase() !== 'unknown') || []
      })))
      .catch(console.error);
  }, []);

  // 2) Year -> Event
  useEffect(() => {
    const { Year } = activeFilters;
    if (!Year.length) {
      setFilterOptions(opts => ({
        Year: opts.Year,
        Event: [], Day: [], Team: [], Misc: []
      }));
      setPhotos([]);
      return;
    }
    const qs = new URLSearchParams();
    Year.forEach(y => qs.append('Year', y));

    fetch(`${FILTERS_URL}?${qs.toString()}`)
      .then(res => res.json())
      .then(data => setFilterOptions(opts => ({
        ...opts,
        Event: data.Event?.filter(v => v.toLowerCase() !== 'unknown') || [],
        Day:   [],
        Team:  [],
        Misc:  []
      })))
      .catch(console.error);
  }, [activeFilters.Year]);

  // 3) Event -> Day
  useEffect(() => {
    const { Year, Event } = activeFilters;
    if (!Year.length || !Event.length) {
      setFilterOptions(opts => ({
        ...opts,
        Day: []
        // no longer clearing Team/Misc here
      }));
      setPhotos([]);
      return;
    }
    const qs = new URLSearchParams();
    Year.forEach(y => qs.append('Year', y));
    Event.forEach(e => qs.append('Event', e));

    fetch(`${FILTERS_URL}?${qs.toString()}`)
      .then(res => res.json())
      .then(data => {
        const rawDays = data.Day
          ?.filter(v => v && v.toUpperCase() !== 'UNKNOWN') || [];
        const sortedDays = [
          ...DAY_ORDER.filter(d => rawDays.includes(d)),
          ...rawDays.filter(d => !DAY_ORDER.includes(d))
        ];
        setFilterOptions(opts => ({
          ...opts,
          Day: sortedDays
          // still not touching Team/Misc
        }));
      })
      .catch(console.error);
  }, [activeFilters.Event]);

  // 4) Event or Day -> Team & Misc
  useEffect(() => {
    const { Year, Event, Day } = activeFilters;
    if (!Year.length || !Event.length || !Day.length) {
      setFilterOptions(opts => ({
        ...opts,
        Team: [], Misc: []
      }));
      setPhotos([]);
      return;
    }
    const qs = new URLSearchParams();
    Year.forEach(y => qs.append('Year', y));
    Event.forEach(e => qs.append('Event', e));
    Day.forEach(d => qs.append('Day', d));

    fetch(`${FILTERS_URL}?${qs.toString()}`)
      .then(res => res.json())
      .then(data => setFilterOptions(opts => ({
        ...opts,
        Team: (data.Team  || []).filter(v => v && v.toLowerCase() !== 'unknown').sort(),
        Misc: (data.Misc  || []).filter(v => v && v.toLowerCase() !== 'unknown').sort()
      })))
      .catch(console.error);
  }, [activeFilters.Event, activeFilters.Day]); // now watches both

  // 5) Any filter change -> load photos
  useEffect(() => {
    const { Year, Event, Day, Team, Misc } = activeFilters;
    if (!Year.length || !Event.length || !Day.length || (!Team.length && !Misc.length)) {
      setPhotos([]);
      return;
    }
    const qs = new URLSearchParams();
    Year.forEach(y   => qs.append('Year', y));
    Event.forEach(e  => qs.append('Event', e));
    Day.forEach(d    => qs.append('Day', d));
    Team.forEach(t   => qs.append('Team', t));
    Misc.forEach(m   => qs.append('Misc', m));

    fetch(`${PHOTOS_URL}?${qs.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const sorted = data.slice().sort((a, b) => a.id.localeCompare(b.id));
        setPhotos(sorted);
      })
      .catch(console.error);
  }, [
    activeFilters.Year,
    activeFilters.Event,
    activeFilters.Day,
    activeFilters.Team,
    activeFilters.Misc
  ]);

  // Toggle multi-select; only Year clears downstream; Team & Misc mutually exclusive
  const toggleFilter = (group, value) => {
    setActiveFilters(prev => {
      const arr     = prev[group] || [];
      const updated = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];

      let next = { ...prev, [group]: updated };

      // Only Year resets everything below
      if (group === 'Year') {
        next = { Year: updated, Event: [], Day: [], Team: [], Misc: [] };
      }

      // mutual exclusivity for Team vs Misc
      if (group === 'Team') {
        next = { ...next, Misc: [] };
      } else if (group === 'Misc') {
        next = { ...next, Team: [] };
      }

      return next;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({ Year: [], Event: [], Day: [], Team: [], Misc: [] });
    setFilterOptions(opts => ({
      Year: opts.Year, Event: [], Day: [], Team: [], Misc: []
    }));
    setPhotos([]);
    setMoreLikeThisPhoto(null); // Also clear the moreLikeThisPhoto when clearing filters
  };

  return (
    <div className="h-screen flex flex-col">
      <Banner title="Track Photo Viewer" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          filters={filterOptions}
          activeFilters={activeFilters}
          onToggle={toggleFilter}
          onClear={clearFilters}
          photosCount={photos.length}
          moreLikeThisPhoto={moreLikeThisPhoto}
          onClearMoreLikeThis={() => setMoreLikeThisPhoto(null)}
        />

        {activeFilters.Year.length > 0 &&
         activeFilters.Event.length > 0 &&
         activeFilters.Day.length > 0 &&
         (activeFilters.Team.length > 0 || activeFilters.Misc.length > 0) ? (
          <ThumbnailGrid 
            photos={photos} 
            setMoreLikeThisPhoto={setMoreLikeThisPhoto}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center font-FuturaPTMedium text-xl text-[rgb(1,44,95)] p-4">
            Please select Year ▶ Event ▶ Day ▶ (Team or Misc) to see photos.
          </div>
        )}
      </div>
    </div>
  );
}
