import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add a response interceptor for handling errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle errors here, e.g., for logging or showing notifications
    // For now, we'll just re-throw the error
    return Promise.reject(error);
  }
);

export default apiClient; 