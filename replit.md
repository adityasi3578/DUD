# Daily Update Dashboard - MyTools

## Overview

This is a full-stack web application for tracking daily productivity updates with comprehensive role-based access control and team management functionality. The application supports two user types:

- **ADMIN users**: Get direct access to an admin panel for creating/managing teams and users, with full system access
- **USER users**: Access team-based dashboards with team switching functionality, can request to join multiple teams

The system enables team collaboration, project tracking, and progress monitoring with role-based permissions and multi-team support.

## Recent Changes (July 2025)

- **UI and Authentication Fixes (Latest)**: Fixed frontend TypeScript errors in useAuth hook, resolved admin authentication locally, and user updates creation now working in both development and production
- **Password Hash Updates**: Updated local database passwords to match production for consistent authentication across environments  
- **Production Database Fixes**: Updated production authentication to use password "12345678" for aditya@gmail.com
- **Sample Data Creation**: Added projects "Website Redesign" and "Mobile App Development" to production GEO Team
- **Team Management**: Successfully created team projects and verified API endpoints working in production
- **Local Development Setup**: Fixed local development to use localhost:5000 with proper sample data
- **API Configuration**: Updated frontend config to use localhost in development, Render backend in production
- **Database Setup**: Created and configured PostgreSQL database with all required tables
- **GitHub Pages Routing Fix**: Implemented complete solution using branch deployment method that works with current repository settings
- **Landing Page**: Added comprehensive landing page with features showcase
- **Touch Optimization**: Improved mobile touch targets and prevented iOS zoom on input focus
- Fixed GitHub Pages deployment workflow by adding required environment configuration
- Resolved authentication issues with userId access in API endpoints
- Fixed logout redirect to use proper signout endpoint instead of Replit auth
- Successfully connected to external Neon PostgreSQL database
- Added missing team management storage methods to prevent 500 errors
- Updated API configuration to work with external infrastructure
- Fixed GitHub Pages 404 routing with comprehensive deployment solution using JamesIves action
- Added .nojekyll file to disable Jekyll processing and enable proper SPA routing
- Updated workflow to deploy to gh-pages branch compatible with current repository settings
- Configured frontend to use Render backend API in production environment

## User Preferences

Preferred communication style: Simple, everyday language.

## External Infrastructure

- **Database**: Neon PostgreSQL - postgresql://neondb_owner:npg_LoDIFbqsHE72@ep-little-poetry-a1gtq6u6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
- **Backend**: Render.com - https://dud-backend-48y7.onrender.com (Service ID: srv-d2519r95pdvs73ccghng)
- **Frontend**: GitHub Pages - https://adityasi3578.github.io/DUD

## System Architecture

The application follows a modern full-stack architecture with:

- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (fully integrated with persistent storage)
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Structure**: Well-organized component hierarchy with reusable UI components
- **Styling**: Tailwind CSS with a custom design system using CSS variables for theming
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts for data visualization
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Backend Architecture
- **API Design**: RESTful API with Express.js
- **Data Layer**: PostgreSQL database with Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between frontend and backend
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot reload with tsx, request logging middleware

### Database Schema
The application uses a comprehensive schema with role-based access control:
- **Users**: User information with role field (USER/ADMIN) and authentication
- **Teams**: Team management with descriptions and created by tracking
- **Team Memberships**: Join requests and active memberships with status tracking
- **Projects**: Team-based project management with priorities and status
- **Project Updates**: Progress tracking and collaboration within teams
- **Daily Updates**: Individual user tracking data (tasks, hours, mood, notes)
- **Goals**: User-defined productivity goals with progress tracking
- **Activities**: Activity feed for user actions and achievements

## Data Flow

1. **User Input**: Forms submit data through React Hook Form with Zod validation
2. **API Layer**: Express routes handle CRUD operations with proper error handling
3. **Storage Layer**: Abstract storage interface allows switching between in-memory and database storage
4. **State Management**: TanStack Query manages server state with automatic caching and synchronization
5. **UI Updates**: Components reactively update based on query state changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### UI Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **recharts**: Charting library for data visualization
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite dev server with HMR for frontend development
- **Backend**: tsx with hot reload for server development
- **Database**: PostgreSQL database with full persistent storage integration

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle configured for PostgreSQL with migrations support
- **Environment**: Uses environment variables for database connection and configuration

### Key Build Commands
- `npm run dev`: Start development servers
- `npm run build`: Build both frontend and backend for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

The application is designed to be easily deployable to platforms like Replit, Vercel, or traditional hosting providers with PostgreSQL support.