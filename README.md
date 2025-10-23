# Hiring Platform

A modern hiring platform built with Next.js 16, TypeScript, and Tailwind CSS that enables administrators to manage job listings and candidates to browse and apply for positions.

## Features

### For Administrators
- **Job Management Dashboard**: View, filter, and manage job listings
- **Job Creation**: Create new job postings with detailed information
- **Status Tracking**: Track job status (Active, Draft, Inactive)
- **Analytics**: Quick stats overview of job listings

### For Candidates
- **Job Browsing**: Browse available job opportunities
- **Detailed View**: View comprehensive job details and requirements
- **Application System**: Apply to jobs with a single click
- **Responsive Design**: Optimized for mobile and desktop

### Authentication
- **Role-based Access**: Separate dashboards for Admin and Candidate roles
- **Secure Authentication**: Powered by Supabase Auth
- **Registration**: Create accounts with role selection

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: Zustand, React Context
- **Forms**: React Hook Form
- **UI Components**: Custom components with Headless UI
- **Icons**: Lucide React
- **Animations**: Lottie React for empty states
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication page
│   ├── admin/             # Admin dashboard
│   │   └── dashboard/     # Job management interface
│   └── dashboard/         # Candidate dashboard
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Button, Input, Card, Badge)
│   ├── admin/            # Admin-specific components
│   └── candidate/        # Candidate-specific components
├── contexts/             # React contexts
│   └── AuthContext.tsx  # Authentication state management
└── lib/                  # Utilities and services
    ├── supabase/        # Supabase client and auth functions
    └── utils.ts         # Utility functions
```

## Setup Instructions

1. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase project URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Create an account or login to access dashboards

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Flow

1. **Registration**: Users register with name, email, password, and role (Admin/Candidate)
2. **Login**: Users authenticate with email and password
3. **Role Routing**: Automatic redirection based on user role:
   - Admin → `/admin/dashboard`
   - Candidate → `/dashboard`

## Key Features Implemented

### UI Components
- **Button**: Multiple variants (primary, secondary, outline, ghost)
- **Input**: Form inputs with error states
- **Card**: Container component for content layout
- **Badge**: Status indicators with color variants
- **Empty State**: Lottie animations for empty content

### Admin Dashboard
- **Job List**: Searchable and filterable job listings
- **Job Cards**: Display job details with status badges
- **Sidebar**: Quick actions and statistics
- **Empty States**: Animated placeholders when no content

### Candidate Dashboard
- **Two-Column Layout**: Job list and detail view
- **Job Selection**: Click to view detailed job information
- **Application**: One-click job application
- **Responsive Design**: Mobile-optimized layout

### Authentication System
- **Supabase Integration**: Secure user authentication
- **Role Management**: User roles stored in metadata
- **Protected Routes**: Route-based access control
- **State Management**: Global auth state with Context API

## Architecture

This project demonstrates modern React/Next.js development patterns including:
- App Router with server and client components
- TypeScript for type safety
- Tailwind CSS for styling
- Component composition and reusability
- State management patterns
- Form handling and validation
- Authentication and authorization
