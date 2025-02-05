import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',  // FastAPI URL
});

// Login API
export const login = (email, password) => {
  return api.post('/login', { email, password });
};

// Get bookings
export const getBookings = () => {
  return api.get('/bookings');
};
