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
  const [isSimilarMode, setIsSimilarMode] = useState(false); // Track if we're in similar photos mode
  const [savedFilterState, setSavedFilterState] = useState(null); // Store filter state when entering similar mode

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
      setIsSimilarMode(false);
      return;
    }
    
    console.log('Fetching similar photos for', moreLikeThisPhoto.id);
    
    // Only save filter state if we're not already in similar mode
    // This prevents overwriting the saved state when clicking "More Like This" multiple times
    if (!isSimilarMode) {
      console.log('Saving filter state:', { activeFilters, filterOptions });
      setSavedFilterState({
        activeFilters: JSON.parse(JSON.stringify(activeFilters)),
        filterOptions: JSON.parse(JSON.stringify(filterOptions))
      });
    }
    
    // Reset filters when entering similar photos mode
    setActiveFilters({ Year: [], Event: [], Day: [], Team: [], Misc: [] });
    
    // Reset slider to default position
    setSliderValue(50);
    
    // Fetch similar photos
    setIsLoadingSimilar(true);
    setIsSimilarMode(true);
    
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
        
        // Extract unique values for each filter category from similar photos
        const years = [...new Set(data.map(photo => photo.Year))].sort();
        
        // Only populate Year filter options initially, following the same pattern as main view
        // Other filters will be populated when a Year is selected
        setFilterOptions({
          Year: years,
          Event: [],
          Day: [],
          Team: [],
          Misc: []
        });
        
        // Store all similar photos with their metadata for filtering later
        // We'll use this data to populate other filters when a Year is selected
      })
      .catch(error => {
        console.error('Error fetching similar photos:', error);
      })
      .finally(() => {
        setIsLoadingSimilar(false);
      });
  }, [moreLikeThisPhoto]);
  
  // 7) Apply filters and slider to similar photos
  useEffect(() => {
    console.log('Filter/Slider effect triggered:', { 
      sliderValue, 
      photosLength: similarPhotos.length, 
      moreLikeThisPhoto: !!moreLikeThisPhoto,
      isSimilarMode,
      activeFilters
    });
    
    if (!similarPhotos.length || !moreLikeThisPhoto || !isSimilarMode) {
      console.log('Skipping effect - not in similar photos mode or no photos');
      return;
    }
    
    // First, apply filters to similar photos
    let filteredPhotos = [...similarPhotos];
    
    // Apply each filter category
    Object.entries(activeFilters).forEach(([category, values]) => {
      if (values.length > 0) {
        filteredPhotos = filteredPhotos.filter(photo => 
          values.includes(photo[category])
        );
      }
    });
    
    console.log(`After filtering: ${filteredPhotos.length} photos out of ${similarPhotos.length}`);
    
    // Then, calculate how many photos to show based on slider value
    // The slider now controls the percentage of filtered photos to show
    // 0% = minimum (20 photos or all if less), 100% = all filtered photos
    let numPhotos;
    const totalFilteredPhotos = filteredPhotos.length;
    
    if (sliderValue <= 0) {
      numPhotos = Math.min(20, totalFilteredPhotos);
    } else if (sliderValue >= 100) {
      numPhotos = totalFilteredPhotos;
    } else {
      // Linear mapping from 0-100% to show proportional amount of filtered photos
      // Ensure at least 20 photos are shown if available
      numPhotos = Math.max(
        Math.min(20, totalFilteredPhotos),
        Math.floor((sliderValue / 100) * totalFilteredPhotos)
      );
    }
    
    console.log(`Slider at ${sliderValue}% - showing ${numPhotos} photos out of ${filteredPhotos.length} filtered photos`);
    
    // Update displayed photos
    setPhotos(filteredPhotos.slice(0, numPhotos));
  }, [sliderValue, similarPhotos, moreLikeThisPhoto, activeFilters, isSimilarMode]);

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
    
    // Handle filter options in similar photos mode
    if (isSimilarMode && similarPhotos.length > 0) {
      if (group === 'Year') {
        // When Year selection changes in similar mode
        const selectedYears = activeFilters.Year.includes(value)
          ? activeFilters.Year.filter(y => y !== value)  // Year was deselected
          : [...activeFilters.Year, value];              // Year was selected
        
        if (selectedYears.length > 0) {
          // Filter similar photos by selected Years
          const filteredByYear = similarPhotos.filter(photo => 
            selectedYears.includes(photo.Year)
          );
          
          // Extract unique Events from the Year-filtered photos
          const events = [...new Set(filteredByYear.map(photo => photo.Event))].sort();
          
          // Update filter options to show Events for selected Years
          setFilterOptions(prev => ({
            ...prev,
            Event: events,
            Day: [],
            Team: []
          }));
        } else {
          // If no Years selected, clear other filter options
          setFilterOptions(prev => ({
            ...prev,
            Event: [],
            Day: [],
            Team: []
          }));
        }
      } else if (group === 'Event') {
        // When Event selection changes
        const selectedEvents = activeFilters.Event.includes(value)
          ? activeFilters.Event.filter(e => e !== value)  // Event was deselected
          : [...activeFilters.Event, value];              // Event was selected
        
        // Filter by both Year and Event
        const filteredPhotos = similarPhotos.filter(photo => 
          activeFilters.Year.includes(photo.Year) && 
          (selectedEvents.length === 0 || selectedEvents.includes(photo.Event))
        );
        
        // Extract unique Days from filtered photos
        const days = [...new Set(filteredPhotos.map(photo => photo.Day))];
        days.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
        
        // Update filter options
        setFilterOptions(prev => ({
          ...prev,
          Day: days,
          Team: []
        }));
      } else if (group === 'Day') {
        // When Day selection changes
        const selectedDays = activeFilters.Day.includes(value)
          ? activeFilters.Day.filter(d => d !== value)  // Day was deselected
          : [...activeFilters.Day, value];              // Day was selected
        
        // Filter by Year, Event, and Day
        const filteredPhotos = similarPhotos.filter(photo => 
          activeFilters.Year.includes(photo.Year) && 
          (activeFilters.Event.length === 0 || activeFilters.Event.includes(photo.Event)) &&
          (selectedDays.length === 0 || selectedDays.includes(photo.Day))
        );
        
        // Extract unique Teams from filtered photos, filtering out blank and 'Unknown' values
        const teams = [...new Set(filteredPhotos.map(photo => photo.Team))]
          .filter(team => team && team.trim() && team.toLowerCase() !== 'unknown')
          .sort();
        
        // Update filter options
        setFilterOptions(prev => ({
          ...prev,
          Team: teams
        }));
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({ Year: [], Event: [], Day: [], Team: [], Misc: [] });
    
    // If in similar mode, reset to show all similar photos (up to slider limit)
    if (isSimilarMode && similarPhotos.length > 0) {
      // Calculate photos to show based on current slider value
      let numPhotos;
      const totalPhotos = similarPhotos.length;
      
      if (sliderValue <= 0) {
        numPhotos = Math.min(20, totalPhotos);
      } else if (sliderValue >= 100) {
        numPhotos = totalPhotos;
      } else {
        // Linear mapping from slider value to photo count
        numPhotos = Math.floor((sliderValue / 100) * totalPhotos);
        // Ensure at least 20 photos if available
        numPhotos = Math.max(Math.min(20, totalPhotos), numPhotos);
      }
      
      setPhotos(similarPhotos.slice(0, numPhotos));
    }
    setFilterOptions(opts => ({
      Year: opts.Year, Event: [], Day: [], Team: [], Misc: []
    }));
    setPhotos([]);
    setMoreLikeThisPhoto(null); // Also clear the moreLikeThisPhoto when clearing filters
    setSimilarPhotos([]);
  };

  const clearMoreLikeThis = () => {
    console.log('Clearing More Like This mode, saved state:', savedFilterState);
    setMoreLikeThisPhoto(null);
    setIsSimilarMode(false);
    setSimilarPhotos([]);
    
    // Restore saved filter state when exiting similar mode
    if (savedFilterState) {
      // Make a deep copy of the saved filter state to avoid any reference issues
      const savedActiveFilters = JSON.parse(JSON.stringify(savedFilterState.activeFilters));
      const { Year, Event, Day, Team, Misc } = savedActiveFilters;
      
      console.log('Restoring filters:', savedActiveFilters);
      
      // First restore the active filters
      setActiveFilters(savedActiveFilters);
      
      // Create a function to load photos once filters are set
      const loadPhotos = () => {
        if (Year.length && Event.length && Day.length && (Team.length || Misc.length)) {
          const photoQs = new URLSearchParams();
          Year.forEach(y => photoQs.append('Year', y));
          Event.forEach(e => photoQs.append('Event', e));
          Day.forEach(d => photoQs.append('Day', d));
          Team.forEach(t => photoQs.append('Team', t));
          Misc.forEach(m => photoQs.append('Misc', m));
          
          console.log('Loading photos with query:', photoQs.toString());
          
          fetch(`${PHOTOS_URL}?${photoQs.toString()}`)
            .then(res => res.json())
            .then(data => {
              if (!Array.isArray(data)) return;
              const sorted = data.slice().sort((a, b) => a.id.localeCompare(b.id));
              setPhotos(sorted);
            })
            .catch(console.error);
        } else {
          setPhotos([]);
        }
      };
      
      // Load all filter options in sequence
      const loadAllFilterOptions = async () => {
        try {
          // 1. First load Year options
          const yearResponse = await fetch(FILTERS_URL);
          const yearData = await yearResponse.json();
          let filterOpts = {
            Year: yearData.Year || [],
            Event: [],
            Day: [],
            Team: [],
            Misc: []
          };
          
          // 2. If Years are selected, load Event options
          if (Year.length > 0) {
            const yearQs = new URLSearchParams();
            Year.forEach(y => yearQs.append('Year', y));
            
            const eventResponse = await fetch(`${FILTERS_URL}?${yearQs.toString()}`);
            const eventData = await eventResponse.json();
            filterOpts.Event = eventData.Event || [];
            
            // 3. If Events are selected, load Day options
            if (Event.length > 0) {
              const eventQs = new URLSearchParams();
              Year.forEach(y => eventQs.append('Year', y));
              Event.forEach(e => eventQs.append('Event', e));
              
              const dayResponse = await fetch(`${FILTERS_URL}?${eventQs.toString()}`);
              const dayData = await dayResponse.json();
              filterOpts.Day = dayData.Day?.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)) || [];
              
              // 4. If Days are selected, load Team and Misc options
              if (Day.length > 0) {
                const dayQs = new URLSearchParams();
                Year.forEach(y => dayQs.append('Year', y));
                Event.forEach(e => dayQs.append('Event', e));
                Day.forEach(d => dayQs.append('Day', d));
                
                const teamResponse = await fetch(`${FILTERS_URL}?${dayQs.toString()}`);
                const teamData = await teamResponse.json();
                
                // Filter out blank and 'Unknown' values from Team filters
                filterOpts.Team = (teamData.Team || [])
                  .filter(team => team && team.trim() && team.toLowerCase() !== 'unknown')
                  .sort();
                  
                // Also filter Misc values for consistency
                filterOpts.Misc = (teamData.Misc || [])
                  .filter(misc => misc && misc.trim() && misc.toLowerCase() !== 'unknown')
                  .sort();
              }
            }
          }
          
          // Set all filter options at once
          console.log('Setting filter options:', filterOpts);
          setFilterOptions(filterOpts);
          
          // Load photos after filter options are set
          loadPhotos();
          
        } catch (error) {
          console.error('Error loading filter options:', error);
        }
      };
      
      // Start the filter option loading process
      loadAllFilterOptions();
      
    } else {
      // If no saved state (shouldn't happen), reset to default
      console.log('No saved filter state found, resetting to default');
      setActiveFilters({ Year: [], Event: [], Day: [], Team: [], Misc: [] });
      
      fetch(FILTERS_URL)
        .then(res => res.json())
        .then(data => setFilterOptions({
          Year: data.Year || [],
          Event: [],
          Day: [],
          Team: [],
          Misc: []
        }))
        .catch(console.error);
        
      setPhotos([]);
    }
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
          onClearMoreLikeThis={clearMoreLikeThis}
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
