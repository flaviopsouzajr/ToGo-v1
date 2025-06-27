# ToGo - Place Discovery Platform

## Overview

ToGo is a full-stack web application designed to help users discover and manage interesting places to visit, including restaurants, tourist attractions, and cities. The application features a modern React frontend with TypeScript, a Node.js/Express backend, and PostgreSQL database integration using Drizzle ORM.

## System Architecture

The application follows a full-stack monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session-based auth
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React Router**: Uses Wouter for lightweight client-side routing
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom ToGo brand colors (green theme)
- **Form Management**: React Hook Form with Zod validation
- **State Management**: TanStack Query for API calls and caching
- **Authentication**: Custom auth context provider with protected routes

### Backend Architecture
- **Express Server**: RESTful API with middleware for authentication and logging
- **Database Layer**: Drizzle ORM with PostgreSQL, using Neon for cloud hosting
- **Authentication**: Passport.js with bcrypt-style password hashing using Node's scrypt
- **Session Management**: PostgreSQL session store for persistent sessions
- **File Uploads**: Multer middleware for handling image and document uploads

### Database Schema
The application uses three main entities:

1. **Users**: Authentication and user management
2. **Place Types**: Categories like "Restaurante", "Ponto Turístico", "Cidade"
3. **Places**: Main entity storing location data, ratings, visit status, and media

Key design decisions:
- Denormalized state/city data for performance (storing both IDs and names)
- Support for file uploads (main images and itinerary documents)
- Boolean flags for restaurant-specific features (rodizio support)
- Decimal ratings with star display components

## Data Flow

1. **Authentication Flow**: Users register/login through forms, server validates credentials and creates sessions
2. **Place Management**: Admin users can create/edit places through forms with file upload support
3. **Place Discovery**: Public users browse places with filtering by type, location, rating, and visit status
4. **File Handling**: Images and documents are uploaded to local storage with validation

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with hooks, React DOM, Wouter for routing
- **Backend**: Express.js with TypeScript support via tsx
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Authentication**: Passport.js with local strategy, express-session
- **Validation**: Zod for runtime type checking and form validation

### UI and Styling
- **Component Library**: Full shadcn/ui suite with Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Zod resolvers

### Development Tools
- **Build Tools**: Vite for frontend, esbuild for backend bundling
- **TypeScript**: Full TypeScript support across the stack
- **Development**: Hot reload with Vite, tsx for backend development

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Production Build**: `npm run build` creates optimized client build and bundles server
- **Production Start**: `npm run start` runs the bundled server
- **Database**: Uses Neon PostgreSQL with connection pooling
- **Static Assets**: Client build served from `/dist/public`, uploads from `/uploads`
- **Environment**: Configured for autoscale deployment on Replit

The server handles both API routes and static file serving, with proper CORS and session management for production environments.

## Changelog

Changelog:
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.