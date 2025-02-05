// src/services/YouTubeService.js
import axios from 'axios';

const YOUTUBE_API_KEY = 'AIzaSyBTZ8s0qBRhoX3ZIHFLYbSu5hpCrSUI3Sk'; // Update with your valid key
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export const fetchMentalHealthShorts = async (pageToken = '') => {
  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        key: YOUTUBE_API_KEY,
        q: 'mental health',
        type: 'video',
        videoDuration: 'short',
        part: 'snippet',
        maxResults: 3,
        pageToken,
        // Ensure only embeddable videos come back
        videoEmbeddable: 'true',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube shorts:', error);
    return null;
  }
};
