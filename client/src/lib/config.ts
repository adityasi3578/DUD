// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dud-backend-48y7.onrender.com';

// Helper function to build API URLs
export function buildApiUrl(path: string): string {
  // In development, use local server for testing
  // In production, use your Render backend
  if (import.meta.env.DEV) {
    // Use relative URLs for local development
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // Production: Use full Render backend URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
} 