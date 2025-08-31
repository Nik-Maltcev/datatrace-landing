// API configuration for DataTrace
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://datatrace-landing-production.up.railway.app';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration:');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('Current origin:', window.location.origin);
  console.log('Using API_BASE_URL:', API_BASE_URL);
}

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
    console.log('🌐 Making API request to:', url);
    console.log('📋 Request config:', config);
    
    const response = await fetch(url, config);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Try to get response text for better error info
      const responseText = await response.text();
      console.error('❌ Non-JSON response:', responseText.substring(0, 200));
      throw new Error(`Server returned ${response.status}: ${response.statusText}. Expected JSON but got: ${contentType}`);
    }

    const data = await response.json();
    console.log('✅ API response data:', data);
    return { response, data };
  } catch (error) {
    console.error('❌ API Request Error:', error);
    console.error('🔗 Failed URL:', url);
    throw error;
  }
}

export default API_ENDPOINTS;