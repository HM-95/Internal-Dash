# Settings Modal Integration Guide

## Overview
This document provides instructions for integrating the settings modal with our user preferences system. The settings modal should have 4 main pages that connect to our backend APIs and user preferences database.

## Current System Architecture

### Database Schema
```sql
user_preferences table:
- id (uuid, primary key)
- user_id (uuid, unique, foreign key to auth.users)
- selected_niches (jsonb) - for AI recommendations
- target_audience_description (text) - for AI recommendations
- subscription_plan (text) - 'starter', 'pro', 'agency'
- subscription_status (text) - 'active', 'cancelled', 'past_due'
- stripe_customer_id (text) - for billing
- stripe_subscription_id (text) - for billing
- onboarding_completed (boolean) - first-time user detection
- onboarding_completed_at (timestamp) - when onboarding was completed
- monthly_imports_used (integer) - tracking imports
- monthly_exports_used (integer) - tracking exports
- monthly_ai_searches_used (integer) - tracking AI searches
- usage_reset_date (date) - when to reset monthly counters
- created_at, updated_at (timestamps)
```

### Available APIs
1. **GET /api/user-preferences** - Fetch user preferences
2. **PUT /api/user-preferences** - Update user preferences
3. **GET /api/user-preferences/usage** - Get usage statistics
4. **POST /api/user-preferences/usage** - Increment usage counters

### React Hook
```typescript
import { useUserPreferences } from '@/hooks/useUserPreferences';

const {
  preferences,
  loading,
  error,
  usageStats,
  updatePreferences,
  incrementUsage,
  refreshPreferences,
  refreshUsage
} = useUserPreferences();
```

## Settings Modal Requirements

### 1. AI Preferences Page
**Purpose**: Allow users to edit their niche preferences and target audience description

**Required Fields**:
- `selected_niches` (string[]) - Array of selected niches
- `target_audience_description` (string) - Text description of target audience

**Available Niches**:
```typescript
const AVAILABLE_NICHES = [
  'Technology', 'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel',
  'Lifestyle', 'Business', 'Finance', 'Education', 'Entertainment',
  'Gaming', 'Sports', 'Health', 'Parenting', 'DIY/Crafts',
  'Automotive', 'Real Estate', 'Pets', 'Comedy', 'Music', 'Art',
  'Photography', 'Science', 'Politics', 'News', 'Religion',
  'Spirituality', 'Environment', 'Social Issues'
];
```

**Integration Points**:
- Use `preferences.selected_niches` to populate selected niches
- Use `preferences.target_audience_description` to populate text area
- Use `updatePreferences()` to save changes
- Show loading state while saving
- Display error messages if save fails

### 2. Change Password Page
**Purpose**: Allow non-Google users to change their password

**Requirements**:
- Only show for users who didn't sign up with Google
- Use Supabase auth for password change
- Show current password field for verification
- Show new password and confirm password fields
- Validate password strength
- Show success/error messages

**Integration Points**:
- Check if user has Google provider in auth metadata
- Use Supabase auth `updateUser()` method
- Handle password validation and error states

### 3. My Plan Page
**Purpose**: Show current plan, usage limits, and upgrade options

**Required Data**:
```typescript
interface UsageStats {
  monthly_imports_used: number;
  monthly_exports_used: number;
  monthly_ai_searches_used: number;
  usage_reset_date: string;
  limits: {
    imports: number;
    exports: number;
    ai_searches: number;
  };
  usage_percentages: {
    imports: number;
    exports: number;
    ai_searches: number;
  };
}
```

**Plan Limits**:
- **Starter**: 100 imports, 50 exports, 10 AI searches ($149/month)
- **Pro**: 2,000 imports, 500 exports, unlimited AI searches ($199/month)
- **Agency**: 7,500 imports, 2,000 exports, unlimited AI searches ($599/month)

**UI Requirements**:
- Display current plan name and price
- Show usage progress bars for each metric
- Display usage reset date
- Show upgrade/downgrade buttons
- Handle unlimited usage display (show "∞" or "Unlimited")

**Integration Points**:
- Use `usageStats` from the hook to populate data
- Use `preferences.subscription_plan` for current plan
- Link to pricing page for upgrades

### 4. Pricing Page
**Purpose**: Display all plans with Stripe integration for upgrades

**Plan Structure**:
```typescript
const SUBSCRIPTION_LIMITS = {
  starter: {
    monthly_imports: 100,
    monthly_exports: 50,
    monthly_ai_searches: 10,
    price: 149,
    data_refresh: 'weekly'
  },
  pro: {
    monthly_imports: 2000,
    monthly_exports: 500,
    monthly_ai_searches: -1, // unlimited
    price: 199,
    data_refresh: 'weekly'
  },
  agency: {
    monthly_imports: 7500,
    monthly_exports: 2000,
    monthly_ai_searches: -1, // unlimited
    price: 599,
    data_refresh: '72_hours'
  }
};
```

**Stripe Integration Requirements**:
- Create Stripe checkout sessions for plan upgrades
- Handle webhook events for subscription updates
- Update user preferences when subscription changes
- Show loading states during payment processing
- Handle payment errors gracefully

**UI Requirements**:
- Display all 3 plans with features and pricing
- Highlight current plan
- Show "Upgrade" or "Downgrade" buttons
- Include 7-day free trial messaging
- Show plan comparison table

## Technical Implementation Guidelines

### Modal Structure
```typescript
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Use a tab-based or page-based navigation within the modal
// Each page should be a separate component for maintainability
```

### State Management
- Use the `useUserPreferences` hook for all data fetching
- Implement local state for form inputs
- Use loading states for all async operations
- Handle error states gracefully

### Error Handling
- Display user-friendly error messages
- Log errors to console for debugging
- Provide retry mechanisms where appropriate
- Handle network failures gracefully

### Loading States
- Show loading spinners during API calls
- Disable buttons during processing
- Provide feedback for all user actions

### Form Validation
- Validate required fields before submission
- Show real-time validation feedback
- Prevent submission with invalid data

## File Structure Recommendations

```
app/components/dashboard/modals/
├── SettingsModal/
│   ├── SettingsModal.tsx (main modal container)
│   ├── pages/
│   │   ├── AIPreferencesPage.tsx
│   │   ├── ChangePasswordPage.tsx
│   │   ├── MyPlanPage.tsx
│   │   └── PricingPage.tsx
│   ├── components/
│   │   ├── PlanCard.tsx
│   │   ├── UsageProgressBar.tsx
│   │   └── NicheSelector.tsx
│   └── hooks/
│       └── useStripeCheckout.ts
```

## Integration Checklist

### AI Preferences Page
- [ ] Load current niches and target audience description
- [ ] Implement niche selection UI (multi-select)
- [ ] Add target audience text area
- [ ] Implement save functionality with loading states
- [ ] Handle validation and error states
- [ ] Show success confirmation

### Change Password Page
- [ ] Check if user has Google provider
- [ ] Implement password change form
- [ ] Add password strength validation
- [ ] Handle Supabase auth integration
- [ ] Show appropriate success/error messages

### My Plan Page
- [ ] Display current plan information
- [ ] Show usage progress bars
- [ ] Display usage limits and current usage
- [ ] Handle unlimited usage display
- [ ] Add upgrade/downgrade navigation
- [ ] Show usage reset date

### Pricing Page
- [ ] Display all 3 plans with features
- [ ] Highlight current plan
- [ ] Implement Stripe checkout integration
- [ ] Handle payment processing states
- [ ] Show plan comparison
- [ ] Include free trial messaging

### General Modal
- [ ] Implement tab/page navigation
- [ ] Add loading states throughout
- [ ] Handle error states gracefully
- [ ] Ensure responsive design
- [ ] Add proper accessibility features

## Testing Requirements

### Unit Tests
- Test each page component in isolation
- Test form validation logic
- Test API integration functions

### Integration Tests
- Test complete user flows
- Test Stripe payment integration
- Test error handling scenarios

### User Acceptance Tests
- Test all user interactions
- Verify data persistence
- Test responsive design

## Notes for AI Implementation

1. **Start with the modal structure** - Build the main container with navigation
2. **Implement one page at a time** - Focus on getting each page working before moving to the next
3. **Use existing UI components** - Leverage the existing button, input, and card components
4. **Follow the established patterns** - Use the same error handling and loading state patterns as other parts of the app
5. **Test thoroughly** - Each page should be fully functional before moving to the next
6. **Consider mobile responsiveness** - Ensure the modal works well on all screen sizes

## Questions for Clarification

If you need clarification on any of these requirements, please ask about:
- Specific UI/UX requirements for each page
- Stripe integration details
- Error handling preferences
- Loading state designs
- Form validation rules
- Accessibility requirements
