// src/App.jsx
import React, { useState, useEffect } from 'react';
import Banner        from './components/Banner';
import Sidebar       from './components/Sidebar';
import ThumbnailGrid from './components/ThumbnailGrid';
import { FILTERS_URL, PHOTOS_URL, SIMILAR_PHOTOS_URL } from './config';

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
  const [similarPhotos, setSimilarPhotos] = useState([]);
  const [sliderValue, setSliderValue] = useState(50); // Default to 50% (200 photos)
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

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

  // 5) Any filter change -> load photos (but not when we're in similar photos mode)
  useEffect(() => {
    // Skip this effect if we're in similar photos mode
    if (moreLikeThisPhoto) return;
    
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
    activeFilters.Misc,
    moreLikeThisPhoto
  ]);
  
  // 6) Fetch similar photos when moreLikeThisPhoto changes
  useEffect(() => {
    console.log('moreLikeThisPhoto effect triggered', moreLikeThisPhoto);
    if (!moreLikeThisPhoto) {
      console.log('No moreLikeThisPhoto, clearing similar photos');
      setSimilarPhotos([]);
      return;
    }
    
    console.log('Fetching similar photos for', moreLikeThisPhoto.id);
    
    // Reset filters when entering similar photos mode
    setActiveFilters({ Year: [], Event: [], Day: [], Team: [], Misc: [] });
    setFilterOptions(opts => ({
      Year: opts.Year, Event: [], Day: [], Team: [], Misc: []
    }));
    
    // Reset slider to default position
    setSliderValue(50);
    
    // Fetch similar photos
    setIsLoadingSimilar(true);
    
    // Request up to 500 similar photos for the slider functionality
    const url = `${SIMILAR_PHOTOS_URL}?id=${moreLikeThisPhoto.id}&limit=500`;
    console.log('Fetching from URL:', url);
    
    fetch(url)
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Received data:', data);
        if (!Array.isArray(data)) {
          console.error('Invalid response from similar photos API', data);
          return;
        }
        console.log(`Got ${data.length} similar photos`);
        setSimilarPhotos(data);
        setPhotos(data.slice(0, 200)); // Initially show 200 photos
      })
      .catch(error => {
        console.error('Error fetching similar photos:', error);
      })
      .finally(() => {
        setIsLoadingSimilar(false);
      });
  }, [moreLikeThisPhoto]);
  
  // 7) Update displayed photos when slider value changes
  useEffect(() => {
    console.log('Slider effect triggered:', { sliderValue, photosLength: similarPhotos.length, moreLikeThisPhoto: !!moreLikeThisPhoto });
    
    if (!similarPhotos.length || !moreLikeThisPhoto) {
      console.log('Skipping slider effect - no similar photos or no moreLikeThisPhoto');
      return;
    }
    
    // Calculate how many photos to show based on slider value
    // 0 = 20 photos, 50 = 200 photos, 100 = all photos (up to 500)
    let numPhotos;
    if (sliderValue <= 0) {
      numPhotos = 20;
    } else if (sliderValue >= 100) {
      numPhotos = similarPhotos.length;
    } else if (sliderValue <= 50) {
      // Map 0-50 to 20-200 photos
      numPhotos = Math.floor(20 + (sliderValue / 50) * 180);
    } else {
      // Map 51-100 to 201-500 photos
      const remaining = similarPhotos.length - 200;
      numPhotos = Math.floor(200 + ((sliderValue - 50) / 50) * remaining);
    }
    
    console.log(`Slider at ${sliderValue}% - showing ${numPhotos} photos out of ${similarPhotos.length}`);
    
    // Update displayed photos
    setPhotos(similarPhotos.slice(0, numPhotos));
  }, [sliderValue, similarPhotos, moreLikeThisPhoto]);

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
    setSimilarPhotos([]);
    setSliderValue(50); // Reset slider to default
  };
  
  // Handle slider value change
  const handleSliderChange = (value) => {
    console.log('Slider changed to:', value);
    setSliderValue(value);
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
          sliderValue={sliderValue}
          onSliderChange={handleSliderChange}
          isLoadingSimilar={isLoadingSimilar}
        />

        {/* Main content area */}
        {(() => {
          // When in "More like this" mode
          if (moreLikeThisPhoto) {
            if (isLoadingSimilar) {
              // Show loading indicator while fetching similar photos
              return (
                <div className="flex-1 flex items-center justify-center font-FuturaPTMedium text-xl text-[rgb(1,44,95)] p-4">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 flex items-center">
                      <svg className="animate-spin h-8 w-8 mr-3 text-[rgb(1,44,95)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Finding similar photos...</span>
                    </div>
                  </div>
                </div>
              );
            } else if (photos.length > 0) {
              // Show thumbnail grid when similar photos are loaded
              return (
                <ThumbnailGrid 
                  photos={photos} 
                  setMoreLikeThisPhoto={setMoreLikeThisPhoto}
                />
              );
            } else {
              // Show error message if no similar photos were found
              return (
                <div className="flex-1 flex items-center justify-center font-FuturaPTMedium text-xl text-[rgb(1,44,95)] p-4">
                  No similar photos found. Try a different photo.
                </div>
              );
            }
          } 
          // When in normal browsing mode
          else if (activeFilters.Year.length > 0 &&
                   activeFilters.Event.length > 0 &&
                   activeFilters.Day.length > 0 &&
                   (activeFilters.Team.length > 0 || activeFilters.Misc.length > 0)) {
            return (
              <ThumbnailGrid 
                photos={photos} 
                setMoreLikeThisPhoto={setMoreLikeThisPhoto}
              />
            );
          } else {
            return (
              <div className="flex-1 flex items-center justify-center font-FuturaPTMedium text-xl text-[rgb(1,44,95)] p-4">
                Please select Year ▶ Event ▶ Day ▶ (Team or Misc) to see photos.
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
