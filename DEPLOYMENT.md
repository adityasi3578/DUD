# GitHub Pages Deployment Guide

This guide will help you deploy your DUD Dashboard to GitHub Pages.

## Prerequisites

1. Your code is pushed to a GitHub repository
2. You have admin access to the repository

## Deployment Steps

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Scroll down to "Pages" section in the left sidebar
4. Under "Source", select "GitHub Actions"

### 2. Configure Repository Settings

1. In the same "Pages" section, make sure:
   - Source is set to "GitHub Actions"
   - Branch is set to "gh-pages" (this will be created automatically)

### 3. Build and Deploy

The GitHub Actions workflow will automatically:
1. Build your React application
2. Deploy it to GitHub Pages
3. Make it available at `https://adityasi3578.github.io/DUD/`

### 4. Access Your Application

Once deployed, you can access your application at:
- **Main URL**: https://adityasi3578.github.io/DUD/
- **Signin Page**: https://adityasi3578.github.io/DUD/signin
- **Signup Page**: https://adityasi3578.github.io/DUD/signup

## Important Notes

### Client-Side Routing
The application uses client-side routing with wouter. The configuration includes:
- Base path set to `/DUD/` in `vite.config.ts`
- Router configured with base `/DUD` in `App.tsx`
- 404.html file for handling direct URL access

### API Endpoints
Make sure your backend API is deployed and accessible. You may need to:
1. Update API endpoints in your frontend code to point to your production backend
2. Configure CORS settings on your backend
3. Set up environment variables for production

### Environment Variables
For production deployment, ensure these environment variables are set:
- `DATABASE_URL` - Your production database connection string
- `SESSION_SECRET` - A secure session secret
- Any other environment-specific variables

## Troubleshooting

### 404 Errors on Direct URL Access
If you get 404 errors when accessing URLs directly (like `/signin`), make sure:
1. The 404.html file is in the `client/public/` directory
2. The redirect script is included in `index.html`
3. The base path is correctly configured

### Build Failures
If the GitHub Actions build fails:
1. Check the Actions tab in your repository
2. Review the build logs for specific errors
3. Ensure all dependencies are properly listed in `package.json`

### Routing Issues
If routing doesn't work properly:
1. Verify the base path configuration in `vite.config.ts`
2. Check that the Router component has the correct base prop
3. Ensure the 404.html redirect script is working

## Manual Deployment (Alternative)

If you prefer manual deployment:

1. Run the build command:
   ```bash
   npm run build:gh-pages
   ```

2. The built files will be in the `dist/` directory

3. Upload the contents of the `dist/` directory to your GitHub Pages branch

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Verify all configuration files are correct
3. Ensure your repository has the necessary permissions for GitHub Pages 