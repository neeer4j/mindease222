// src/contexts/TherapistFindContext.jsx

import React, { createContext, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

// Create the context
export const TherapistFindContext = createContext();

// Provider component
export const TherapistFindProvider = ({ children }) => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Keep track of when data was last fetched (in milliseconds)
  const [lastFetched, setLastFetched] = useState(0);
  const { user } = useContext(AuthContext);

  // Retrieve API key from environment variables
  const googleApiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.error("Google API key is not defined.");
  }

  /**
   * Lazy load the Google Maps JavaScript API.
   * Returns a Promise that resolves when the API is loaded.
   */
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      // If already loaded, resolve immediately.
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }
      // Create the script element.
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps API loaded but not available."));
        }
      };
      script.onerror = () =>
        reject(new Error("Google Maps API failed to load."));
      document.head.appendChild(script);
    });
  };

  /**
   * Helper function to check if Google Maps API is loaded.
   */
  const isGoogleMapsLoaded = () => {
    return typeof window !== "undefined" && window.google && window.google.maps;
  };

  /**
   * Helper function to fetch place details using the Place Details API.
   *
   * @param {string} placeId - The place ID of the location.
   * @returns {Promise<object>} - Resolves with the detailed place object.
   */
  const fetchPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      service.getDetails({ placeId }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(place);
        } else {
          reject(new Error("Failed to fetch details: " + status));
        }
      });
    });
  };

  /**
   * Fetch therapist recommendations based on the user's latitude and longitude
   * using the Google Places API.
   *
   * @param {number} latitude - User's latitude.
   * @param {number} longitude - User's longitude.
   * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data.
   */
  const fetchTherapists = async (latitude, longitude, forceRefresh = false) => {
    // If not forcing refresh and data is already cached within 10 minutes, skip refetching.
    if (
      !forceRefresh &&
      therapists.length > 0 &&
      Date.now() - lastFetched < 600000
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lazy load Google Maps API if it's not already available.
      if (!isGoogleMapsLoaded()) {
        await loadGoogleMapsScript();
      }

      // Create an invisible map container (not added to the DOM)
      const mapContainer = document.createElement("div");
      const map = new window.google.maps.Map(mapContainer);

      // Create a LatLng object for the given coordinates.
      const location = new window.google.maps.LatLng(latitude, longitude);

      // Build the request object.
      const request = {
        location,
        radius: 8000, // 8 km radius (adjust as needed)
        type: "doctor", // Using a string instead of an array.
        keyword: "therapist", // Helps narrow results.
      };

      console.log("Request object for nearbySearch:", request);

      // Instantiate the PlacesService.
      const service = new window.google.maps.places.PlacesService(map);

      // Perform the nearby search using a Promise.
      const results = await new Promise((resolve, reject) => {
        service.nearbySearch(request, (places, status) => {
          console.log("Places API status:", status);
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(places);
          } else if (
            status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve([]); // No results found.
          } else {
            reject(new Error("Places service failed: " + status));
          }
        });
      });

      if (results.length === 0) {
        setError("No therapists found nearby.");
        setTherapists([]);
        return;
      }

      // For each result, fetch detailed information and map the data.
      const mappedData = await Promise.all(
        results.map(async (result) => {
          let phone = "N/A";
          try {
            const details = await fetchPlaceDetails(result.place_id);
            phone = details.formatted_phone_number || "N/A";
          } catch (detailsError) {
            console.warn(
              `Failed to fetch details for ${result.place_id}:`,
              detailsError
            );
          }
          return {
            id: result.place_id,
            name: result.name,
            specialty: result.types ? result.types.join(", ") : "Therapist",
            address: result.vicinity || "Unknown address",
            rating: result.rating || "N/A",
            phone, // Retrieved from Place Details API.
            avatarUrl: result.photos
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${googleApiKey}`
              : result.icon, // Use default icon if no photo available.
          };
        })
      );

      setTherapists(mappedData);
      setLastFetched(Date.now());
    } catch (err) {
      console.error("Error fetching therapists:", err);
      setError(err.message || "Failed to fetch therapists.");
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
