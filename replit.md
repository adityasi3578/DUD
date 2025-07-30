# Daily Update Dashboard - MyTools

## Overview

This is a full-stack web application for tracking daily productivity updates. The application allows users to log their daily activities including tasks completed, hours worked, mood, and notes. It provides a dashboard with analytics, goal tracking, and activity feeds to help users monitor their productivity over time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with:

- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (currently using in-memory storage for development)
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
- **Data Layer**: Storage abstraction layer with interface-based design for easy database switching
- **Validation**: Zod schemas shared between frontend and backend
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot reload with tsx, request logging middleware

### Database Schema
The application uses four main entities:
- **Users**: Basic user information and authentication
- **Daily Updates**: Core tracking data (tasks, hours, mood, notes)
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
- **Database**: Currently using in-memory storage, configured for PostgreSQL

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