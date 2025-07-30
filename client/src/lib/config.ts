// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-railway-app.railway.app';

// Helper function to build API URLs
export function buildApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
} 