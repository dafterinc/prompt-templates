# Software Architecture

## Overview

Prompt Templates is a lightweight web application designed for building, managing, and generating text prompts with customizable variables. The architecture follows a modern frontend-first approach with cloud sync capabilities through Supabase.

## Technology Stack

### Frontend
- **Svelte**: A lightweight, compiler-based framework that shifts work to build-time instead of runtime
- **ShadCN**: Component library providing accessible, customizable UI elements
- **TailwindCSS**: Utility-first CSS framework for styling (used by ShadCN)
- **Vite**: Fast, modern build tool and development server

### Backend/Data Storage
- **Supabase**: Open-source Firebase alternative providing:
  - PostgreSQL database for storing prompt templates
  - Authentication system for user management
  - Row-level security for data protection
  - Realtime capabilities for future collaborative features

### State Management
- **Svelte stores**: Built-in state management for application data
- **Local storage/IndexedDB**: Offline-first functionality for uninterrupted usage
- **Supabase sync**: Synchronization of local data with cloud database

## Architecture Components

### Core Components
1. **Authentication System**
   - User registration and login
   - JWT token management
   - Session persistence

2. **Template Management**
   - Template creation interface
   - Template editing and updating
   - Template organization (categories, tags)
   - Template storage and retrieval

3. **Template Usage**
   - Variable substitution engine
   - Preview functionality
   - Copy-to-clipboard functionality

4. **Sync Engine**
   - Data synchronization between local storage and Supabase
   - Conflict resolution for offline changes
   - Background sync capabilities

### Future Components (Teams Feature)
1. **Sharing System**
   - Access control management
   - Sharing links/invitations
   - Team management

2. **Collaborative Editing**
   - Real-time updates
   - Version control
   - Change tracking

## Data Flow

1. User creates/edits templates locally
2. Changes are immediately stored in local storage/IndexedDB
3. When online, changes are synchronized to Supabase
4. On application load, latest data is pulled from Supabase and merged with local changes

## Deployment Strategy

- **Frontend**: Static site hosting via Netlify or Vercel
- **Backend**: Fully managed by Supabase cloud infrastructure
- **CI/CD**: Automated deployment pipeline for testing and production environments 