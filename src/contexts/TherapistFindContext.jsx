// src/contexts/TherapistFindContext.jsx

import React, { createContext, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axios from 'axios';

// Create the context
export const TherapistFindContext = createContext();

// Provider component
export const TherapistFindProvider = ({ children }) => {
  // Initialize state from localStorage to avoid API call on page refresh
  const [therapists, setTherapists] = useState(() => {
    const cached = localStorage.getItem("therapists");
    return cached ? JSON.parse(cached) : [];
  });
  const [lastFetched, setLastFetched] = useState(() => {
    const cached = localStorage.getItem("lastFetched");
    return cached ? Number(cached) : 0;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  /**
   * Helper function to search for therapists using OSM's Nominatim API
   * @param {number} latitude - User's latitude
   * @param {number} longitude - User's longitude
   * @returns {Promise<Array>} - Array of therapist locations
   */
  const searchTherapists = async (latitude, longitude) => {
    // Validate and normalize coordinates
    const validLat = Number(latitude);
    const validLon = Number(longitude);

    if (isNaN(validLat) || isNaN(validLon) || 
        validLat < -90 || validLat > 90 || 
        validLon < -180 || validLon > 180) {
      console.error('Invalid coordinates:', { latitude, longitude });
      throw new Error('Invalid coordinates provided');
    }

    console.log('Searching with normalized coordinates:', { latitude: validLat, longitude: validLon });

    // Increase delta for a 60km radius viewbox
    const delta = 0.55; // Approx 60km radius at equator
    const viewbox = [
      validLon - delta,
      validLat - delta,
      validLon + delta,
      validLat + delta
    ].join(',');
    console.log('Search viewbox (approx 60km radius):', viewbox);

    // Keep broader search terms
    const searchQueries = [
      'psychiatrist',
      'psychologist',
      'mental health hospital',
      'counselling centre',
      'psychological counselling',
      'mental health clinic',
      'psychiatric clinic',
      'hospital',
      'clinic',
      'healthcare'
    ];

    let allResults = [];
    
    for (const q of searchQueries) {
      try {
        console.log(`Searching for: ${q}`);
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            format: 'json',
            q: q,
            viewbox: viewbox,
            bounded: 1,
            addressdetails: 1,
            limit: 50,
            'accept-language': 'en,ml',
            dedupe: 1
          }
        });
        
        console.log(`Found ${response.data.length} results for "${q}"`);
        allResults = [...allResults, ...response.data];
      } catch (error) {
        console.error(`Search failed for query "${q}":`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Total results fetched from Nominatim:', allResults.length);

    // Remove duplicates
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.place_id, item])).values()
    );
    console.log('Unique results after deduplication:', uniqueResults.length);

    // Define relevant specialties
    const relevantSpecialties = [
      'Psychologist',
      'Psychiatrist / Mental Health',
      'Counselor',
      'Therapist'
    ];

    // Process results and map specialty
    const mappedResults = uniqueResults
      .map(place => {
        const distance = calculateDistance(validLat, validLon, place.lat, place.lon);
        
        let name = place.display_name.split(',')[0];
        name = name
          .replace(/^the /i, '')
          .replace(/(clinic|center|centre|practice|office|therapy|counseling|counselling|hospital)/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (name.length < 3) {
          const addressParts = place.display_name.split(',');
          name = addressParts[0].trim();
          if (name.length < 3 && addressParts.length > 1) name = addressParts[1].trim();
        }
        
        let specialty = 'Healthcare Provider'; // Default
        const lowerDisplayName = place.display_name.toLowerCase();
        if (lowerDisplayName.includes('psychologist') || lowerDisplayName.includes('psychology')) specialty = 'Psychologist';
        else if (lowerDisplayName.includes('psychiatrist') || lowerDisplayName.includes('psychiatric') || lowerDisplayName.includes('mental health')) specialty = 'Psychiatrist / Mental Health';
        else if (lowerDisplayName.includes('counseling') || lowerDisplayName.includes('counselling')) specialty = 'Counselor';
        else if (lowerDisplayName.includes('therapy') || lowerDisplayName.includes('therapist')) specialty = 'Therapist';

        return {
          id: place.place_id,
          name: name,
          specialty: specialty,
          address: place.display_name,
          rating: '4.5',
          phone: 'Contact for details',
          distance: distance,
          lat: place.lat,
          lon: place.lon
        };
      });

    console.log('Mapped results before filtering:', mappedResults.length);

    // Filter by distance (60km) AND specialty
    const finalResults = mappedResults
      .filter(result => {
        const isNearby = result.distance <= 60; // Updated distance filter to 60km
        const isRelevant = relevantSpecialties.includes(result.specialty);
        return isNearby && isRelevant;
      })
      .sort((a, b) => a.distance - b.distance);

    console.log('Final results after distance (60km) & specialty filtering:', finalResults.length);

    if (finalResults.length === 0) {
      console.log('No relevant mental health services found within 60km radius');
      setError("No relevant mental health services found nearby (within 60km)."); // Update error message
      setTherapists([]);
      localStorage.removeItem("therapists");
      localStorage.removeItem("lastFetched");
    } else {
      console.log('Top results:', finalResults.slice(0, 10));
      setTherapists(finalResults);
      setLastFetched(Date.now());
      localStorage.setItem("therapists", JSON.stringify(finalResults));
      localStorage.setItem("lastFetched", Date.now().toString());
      setError(null); // Clear any previous error
    }
  };

  /**
   * Calculate distance between two points using Haversine formula
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Simplified logging
    lat1 = Number(lat1);
    lon1 = Number(lon1);
    lat2 = Number(lat2);
    lon2 = Number(lon2);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      console.error('Invalid number in distance calculation for coords:', { lat1, lon1, lat2, lon2 });
      return Infinity;
    }
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  };

  /**
   * Fetch therapist recommendations based on the user's latitude and longitude
   * using OpenStreetMap's Nominatim API.
   *
   * @param {number} latitude - User's latitude
   * @param {number} longitude - User's longitude
   * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
   */
  const fetchTherapists = async (latitude, longitude, forceRefresh = false) => {
    // If not forcing refresh and data is already cached, skip refetching
    const cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    if (!forceRefresh && therapists.length > 0 && (Date.now() - lastFetched < cacheExpiry)) {
      console.log("Using cached therapist data.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await searchTherapists(latitude, longitude);
    } catch (err) {
      console.error("Error in fetchTherapists wrapper:", err);
      setError(err.message || "Failed to fetch therapists.");
      setTherapists([]);
      localStorage.removeItem("therapists");
      localStorage.removeItem("lastFetched");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear therapist data and reset errors.
   * This forces a refresh on the next API call.
   */
  const clearTherapists = () => {
    setTherapists([]);
    setError(null);
    setLastFetched(0);
    localStorage.removeItem("therapists");
    localStorage.removeItem("lastFetched");
  };

  return (
    <TherapistFindContext.Provider
      value={{
        therapists,
        loading,
        error,
        fetchTherapists,
        clearTherapists,
      }}
    >
      {children}
    </TherapistFindContext.Provider>
  );
};

export default TherapistFindContext;