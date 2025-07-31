// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://dud-backend-48y7.onrender.com');

// Helper function to build API URLs
export function buildApiUrl(path: string): string {
  // In development, use local server
  // In production, use your Render backend
  if (import.meta.env.DEV) {
    // Use localhost for local development
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `http://localhost:5000/${cleanPath}`;
  }
  
  // Production: Use full Render backend URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
} 