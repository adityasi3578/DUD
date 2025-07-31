// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build API URLs
export function buildApiUrl(path: string): string {
  // In development, use relative URLs to work with the Vite proxy
  // In production, use the base URL
  if (import.meta.env.DEV) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // Remove leading slash if present for production
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
} 