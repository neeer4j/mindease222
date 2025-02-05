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

  /**
   * Ensure Google Maps API is loaded before calling Places API.
   */
  const isGoogleMapsLoaded = () => {
    return typeof window !== "undefined" && window.google && window.google.maps;
  };

  /**
   * Compute the distance between two points (in km) using the Haversine formula.
   *
   * @param {number} lat1 - Latitude of the first point.
   * @param {number} lon1 - Longitude of the first point.
   * @param {number} lat2 - Latitude of the second point.
   * @param {number} lon2 - Longitude of the second point.
   * @returns {number} - The distance in kilometers.
   */
  const computeDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Helper function to fetch place details using the Place Details API.
   *
   * @param {string} placeId - The place ID of the location.
   * @returns {Promise<object>} - Resolves with the detailed place object.
   */
  const fetchPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      // Create a dummy div for the PlacesService (not added to the DOM)
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
    // If not forcing refresh and data is already cached within 5 minutes, skip refetching.
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
      if (!isGoogleMapsLoaded()) {
        throw new Error("Google Maps JavaScript API is not loaded.");
      }

      // Create an invisible map container (not added to the DOM)
      const mapContainer = document.createElement("div");
      const map = new window.google.maps.Map(mapContainer);

      // Create a LatLng object for the given coordinates.
      const locationObj = new window.google.maps.LatLng(latitude, longitude);

      // Build the request object.
      const request = {
        location: locationObj,
        radius: 20000, // Extended radius: 20,000 meters (20 km)
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

      // Retrieve the API key from environment variables.
      const googleApiKey = process.env.REACT_APP_GOOGLE_API_KEY;

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

          // Calculate distance using the helper (in kilometers)
          let distance = null;
          if (result.geometry && result.geometry.location) {
            const placeLat = result.geometry.location.lat();
            const placeLng = result.geometry.location.lng();
            distance = computeDistance(latitude, longitude, placeLat, placeLng);
          }

          return {
            id: result.place_id,
            name: result.name,
            specialty: result.types ? result.types.join(", ") : "Therapist",
            address: result.vicinity || "Unknown address",
            rating: result.rating || "N/A",
            phone, // Retrieved from Place Details API.
            distance, // Distance in km (as a number)
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
