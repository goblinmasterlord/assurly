import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Request metadata storage
const requestMetadata = new Map<string, { startTime: number }>();

// Debug logging control
const DEBUG_API = import.meta.env.VITE_DEBUG_API === 'true';

// Enhanced API client with industry-standard optimizations
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging and auth
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Store timestamp for performance monitoring
    const requestId = `${config.method}-${config.url}-${Date.now()}`;
    requestMetadata.set(requestId, { startTime: Date.now() });
    config.headers['X-Request-Id'] = requestId;
    
    // Log requests if debug is enabled
    if (DEBUG_API) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // TODO: Add auth token when authentication is implemented
    // if (authToken) {
    //   config.headers.Authorization = `Bearer ${authToken}`;
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling and performance monitoring
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Performance monitoring
    const requestId = response.config.headers['X-Request-Id'] as string;
    const metadata = requestMetadata.get(requestId);
    const duration = metadata ? Date.now() - metadata.startTime : 0;
    
    if (DEBUG_API) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }
    
    // Clean up metadata
    if (requestId) {
      requestMetadata.delete(requestId);
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error handling with user-friendly messages
    const requestId = error.config?.headers?.['X-Request-Id'] as string;
    const metadata = requestId ? requestMetadata.get(requestId) : null;
    const duration = metadata ? Date.now() - metadata.startTime : 0;
    
    if (DEBUG_API) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error);
    }
    
    // Transform errors into user-friendly format
    const enhancedError = {
      ...error,
      userMessage: getUserFriendlyErrorMessage(error),
      isNetworkError: !error.response,
      statusCode: error.response?.status,
      retryable: isRetryableError(error),
    };
    
    return Promise.reject(enhancedError);
  }
);

// User-friendly error message mapping
function getUserFriendlyErrorMessage(error: AxiosError): string {
  if (!error.response) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  const status = error.response.status;
  const statusText = error.response.statusText;
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in and try again.';
    case 403:
      return 'You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timeout. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Our team has been notified. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    default:
      return `An error occurred (${status}: ${statusText}). Please try again.`;
  }
}

// Determine if an error is retryable
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) return true; // Network errors are retryable
  
  const status = error.response.status;
  // Retry on 5xx server errors and 408 timeout
  return status >= 500 || status === 408;
}

export default apiClient; 