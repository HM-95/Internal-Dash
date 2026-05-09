# Internal Access Control System

This document describes the internal access control system implemented for the Buzzberry platform.

## Overview

The platform has been converted from a public invitation-based system to an internal-only tool with group-based access control. This allows only authorized team members to access the platform using predefined username/password combinations.

## Access Groups

### 1. Code Access (Co-founders and Developers)
- **Usernames**: `hari_m`, `odin_l`, `avik_r`
- **Password**: `Havendev%2026`
- **Access Level**: Full platform access

### 2. Non-Code Access (Other Team Members)
- **Username**: `member_haven`
- **Password**: `Team@haven.2026`
- **Access Level**: Standard platform access

### 3. Guest Access (Temporary Access)
- **Username**: To be added as needed
- **Password**: `Haven@guest.2026`
- **Access Level**: Limited platform access

## System Architecture

### Database Schema

#### `internal_users` Table
```sql
- id (UUID, Primary Key)
- username (VARCHAR(50), Unique)
- password_hash (TEXT)
- access_group (VARCHAR(20)) -- 'code_access', 'non_code_access', 'guest_access'
- is_active (BOOLEAN)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `internal_access_logs` Table
```sql
- id (UUID, Primary Key)
- username (VARCHAR(50))
- action (VARCHAR(50)) -- 'login_attempt', 'login_success', 'login_failed', 'logout'
- ip_address (VARCHAR(45))
- user_agent (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### Authentication Flow

1. **Login Request**: User submits username/password
2. **Password Verification**: bcrypt hash comparison
3. **Session Creation**: JWT token with 8-hour expiry
4. **Access Logging**: All attempts logged to database
5. **Route Protection**: Middleware validates JWT on protected routes

### Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure session management
- **HttpOnly Cookies**: Prevents XSS attacks
- **Access Logging**: Comprehensive audit trail
- **Rate Limiting**: Built into authentication system
- **Session Expiry**: 8-hour automatic logout

## Setup Instructions

### 1. Database Setup

Run the migration script in Supabase SQL editor:
```sql
-- See database/migrations/internal_access_system.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` with:
```env
JWT_SECRET=your-secure-jwt-secret
INTERNAL_AUTH_SECRET=your-internal-auth-secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Setup Initial Users

```bash
node scripts/setup-internal-users.js
```

### 5. Start Development Server

```bash
npm run dev
```

## Usage

### Login Process

1. Navigate to `/login`
2. Enter username and password
3. System validates credentials
4. Creates secure session
5. Redirects to dashboard

### Access Control

- **Code Access**: Full platform functionality
- **Non-Code Access**: Standard user features
- **Guest Access**: Limited features (configurable)

### Session Management

- Sessions expire after 8 hours of inactivity
- Users are automatically logged out
- All login attempts are logged
- Failed attempts are tracked

## Monitoring

### Access Logs

Monitor user activity through the `internal_access_logs` table:
- Login attempts (successful and failed)
- Logout events
- IP addresses and user agents
- Timestamps for all activities

### Security Monitoring

- Track failed login attempts
- Monitor unusual access patterns
- Review access logs regularly
- Update passwords periodically

## Adding New Users

### Adding Guest Users

1. Connect to Supabase database
2. Insert new user record:
```sql
INSERT INTO internal_users (username, password_hash, access_group) 
VALUES ('guest_username', 'hashed_password', 'guest_access');
```

3. Hash password using bcrypt (12 rounds)
4. Test login with new credentials

### Password Management

- Use strong, unique passwords
- Hash passwords with bcrypt (12+ rounds)
- Update passwords regularly
- Never store plain text passwords

## Disabled Features

The following features have been disabled but preserved for potential future use:

- **Onboarding Flow**: Redirects to dashboard
- **Stripe Integration**: All payment features disabled
- **Invitation System**: Redirects to login
- **OAuth (Google Sign-in)**: Disabled
- **Public Registration**: No longer available

## File Structure

```
app/
├── api/internal-auth/          # Internal authentication API
├── lib/internal-auth.ts        # Authentication utilities
├── login/                      # Updated login page
├── dashboard/                  # Updated dashboard layout
└── components/                 # UI components (preserved)

database/migrations/
└── internal_access_system.sql  # Database schema

scripts/
├── setup-internal-access.js    # Setup script
└── setup-internal-users.js     # User creation script

REVERT_TO_PUBLIC.md            # Re-enablement instructions
```

## Troubleshooting

### Common Issues

1. **Login Fails**: Check username/password combination
2. **Session Expired**: Re-login required
3. **Database Connection**: Verify Supabase credentials
4. **JWT Errors**: Check JWT_SECRET environment variable

### Debug Steps

1. Check browser console for errors
2. Verify environment variables
3. Check Supabase database connection
4. Review access logs in database
5. Test with different user accounts

## Security Best Practices

1. **Regular Password Updates**: Change passwords quarterly
2. **Access Monitoring**: Review logs weekly
3. **Environment Security**: Keep secrets secure
4. **Database Security**: Use RLS policies
5. **Session Management**: Monitor active sessions

## Support

For issues or questions:
1. Check this documentation first
2. Review access logs for clues
3. Test with different user accounts
4. Verify environment configuration
5. Check Supabase dashboard for errors

## Future Considerations

- **Multi-Factor Authentication**: Add 2FA support
- **Role-Based Permissions**: Granular access control
- **Session Management UI**: Admin panel for sessions
- **Advanced Monitoring**: Real-time access monitoring
- **Integration**: Connect with existing identity systems
