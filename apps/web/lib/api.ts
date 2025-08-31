// API configuration for DataTrace
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.origin) || 
  'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    SIGNIN: `${API_BASE_URL}/api/auth/signin`,
    SIGNOUT: `${API_BASE_URL}/api/auth/signout`,
    USER: `${API_BASE_URL}/api/auth/user`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  }
};

// Helper function for API requests
export async function apiRequest(url: string, options: RequestInit = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

export default API_ENDPOINTS;