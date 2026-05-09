# Buzzberry Frontend Integration Guide

## Project Overview
Buzzberry is a creator marketing platform with a React frontend built with Vite, TypeScript, and Tailwind CSS. The app needs a Node.js backend for authentication, invitation codes, and waitlist management.

## Current Frontend Structure

### Routes & Pages
1. **/** - Login page (`src/screens/Frame/Frame.tsx`)
2. **/private-beta** - Invitation code verification (`src/screens/PrivateBeta/PrivateBeta.tsx`)
3. **/waitlist** - Waitlist signup form (`src/screens/Waitlist/Waitlist.tsx`)
4. **/waitlist-success** - Success confirmation (`src/screens/WaitlistSuccess/WaitlistSuccess.tsx`)

### Authentication Flow
1. User lands on login page with email/password fields and Google OAuth button
2. After login → redirect to `/private-beta`
3. User enters invitation code → if valid, access granted
4. If no invitation code → option to join waitlist
5. Waitlist submission → redirect to success page

## Required API Endpoints

### Authentication
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; };
  message?: string;
}

// POST /api/auth/google
interface GoogleAuthRequest {
  token: string; // Google OAuth token
}
interface GoogleAuthResponse {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; };
  message?: string;
}

// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
}
interface RegisterResponse {
  success: boolean;
  message: string;
}
```

### Invitation System
```typescript
// POST /api/invitation/verify
interface InvitationRequest {
  code: string;
}
interface InvitationResponse {
  success: boolean;
  valid: boolean;
  message: string;
}
```

### Waitlist Management
```typescript
// POST /api/waitlist/join
interface WaitlistRequest {
  email: string;
  companyName: string;
  websiteUrl: string;
  position: 'founder' | 'co-founder' | 'ceo' | 'cmo' | 'marketing-director' | 'marketing-manager' | 'other';
}
interface WaitlistResponse {
  success: boolean;
  message: string;
}
```

## Frontend Form Data Structures

### Login Form (Frame.tsx)
- Email input: `placeholder="please enter your email"`
- Password input: `placeholder="choose your password"`
- Google OAuth button available
- Navigation: Success → `/private-beta`

### Invitation Code Form (PrivateBeta.tsx)
- Single input: `placeholder="Please enter your invitation code"`
- Navigation: Success → main app, Failure → show waitlist option
- Fallback: "Join Waitlist" button → `/waitlist`

### Waitlist Form (Waitlist.tsx)
- Email: `type="email"` required
- Company Name: `type="text"` required
- Website URL: `placeholder="www.yourwebsite.com"` required
- Position: Select dropdown with predefined options
- Navigation: Success → `/waitlist-success`

## UI/UX Requirements

### Design System
- Primary color: `#d266a3` (pink/purple)
- Hover color: `#c15594`
- Background: White with video backgrounds
- Border radius: `rounded-xl` (12px)
- Font: Inter (already imported)

### Responsive Design
- Mobile: Full-screen video background with overlay forms
- Desktop: Split layout (video left, form right)
- Video: `/BuzzBerry Social Media video.mp4` (already in public folder)

### Error Handling
- Show validation errors inline
- Toast notifications for API errors
- Loading states for form submissions

## Security Requirements
- JWT token storage (localStorage or httpOnly cookies)
- CORS configuration for frontend domain
- Rate limiting on auth endpoints
- Input validation and sanitization
- Password hashing (bcrypt)

## Email Integration
- Waitlist confirmation emails
- Invitation code delivery
- Welcome emails for approved users
- Use service like Resend or SendGrid

## Database Schema Needs

### Users Table
```sql
- id (UUID, primary key)
- email (unique, not null)
- password_hash (nullable for Google users)
- google_id (nullable)
- created_at, updated_at
- is_verified (boolean)
```

### Invitation Codes Table
```sql
- id (UUID, primary key)
- code (unique, not null)
- is_used (boolean, default false)
- used_by_user_id (UUID, foreign key)
- created_at, expires_at
```

### Waitlist Entries Table
```sql
- id (UUID, primary key)
- email (unique, not null)
- company_name (not null)
- website_url (not null)
- position (enum, not null)
- created_at
- is_approved (boolean, default false)
```

## Deployment Configuration
- Frontend: Already built with Vite
- Backend: Will need to serve from subdomain or path
- Domain: app.buzzberry.io
- Environment: Production-ready with proper error handling

## Integration Points
1. Update frontend API calls to use backend endpoints
2. Add JWT token management
3. Implement proper error handling
4. Add loading states
5. Configure CORS for production domain

## Current Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^7.6.3",
  "lucide-react": "^0.453.0",
  "@radix-ui/react-select": "^2.2.5",
  "tailwindcss": "3.4.16",
  "vite": "6.0.4"
}
```

## Next Steps for Backend Development
1. Set up Express.js with TypeScript
2. Configure PostgreSQL with Prisma ORM
3. Implement JWT authentication
4. Set up Google OAuth
5. Create invitation code system
6. Build waitlist management
7. Add email service integration
8. Deploy to production environment