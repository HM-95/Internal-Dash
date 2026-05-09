# Subscription Logic Documentation

## Overview
The subscription system uses TWO fields to determine user access:

## Field Definitions

### `subscription_plan`
- **Purpose**: Determines what the user has paid for
- **Values**: `'free'` | `'starter'` | `'pro'` | `'agency'`
- **Pricing**: 
  - `free` = $0/month (unpaid users)
  - `starter` = $149/month (paid tier)
  - `pro` = $199/month (paid tier)
  - `agency` = $599/month (paid tier)

### `subscription_status` 
- **Purpose**: Tracks Stripe subscription state
- **Values**: `'active'` | `'cancelled'` | `'past_due'`
- **Logic**:
  - `active` = Account/subscription is active
  - `cancelled` = Subscription was cancelled
  - `past_due` = Payment failed

## User States

| Plan | Status | User Type | Dashboard Access | Meaning |
|------|--------|-----------|------------------|---------|
| `free` | `active` | **Unpaid User** | ❌ **BLOCKED** | Free account (no payment) |
| `starter` | `active` | **Paid User ($149)** | ✅ **ALLOWED** | Active starter subscription |
| `pro` | `active` | **Paid User ($199)** | ✅ **ALLOWED** | Active pro subscription |
| `agency` | `active` | **Paid User ($599)** | ✅ **ALLOWED** | Active agency subscription |
| `starter` | `cancelled` | **Ex-Paid User** | ❌ **BLOCKED** | Cancelled starter subscription |

## Dashboard Protection Logic

```typescript
// Users are blocked if EITHER condition is true:
if (preferences.subscription_plan === 'free' || 
    preferences.subscription_status !== 'active') {
  redirect('/onboarding');
}
```

**Translation**: Only users with paid plans (`starter`/`pro`/`agency`) AND active status can access the dashboard.

## Subscription Pricing Clarification

**ALL subscription plans require payment:**
- `free` = $0/month (unpaid users, blocked from dashboard)
- `starter` = $149/month (paid users, dashboard access)
- `pro` = $199/month (paid users, dashboard access)  
- `agency` = $599/month (paid users, dashboard access)

**Important**: `starter` is NOT free - it's a $149/month paid plan!

## Onboarding Flow

1. **New User**: Gets `free` + `active` (unpaid)
2. **Completes Onboarding**: Still `free` + `active` (blocked from dashboard)
3. **Purchases Subscription**: Gets `starter`/`pro`/`agency` + `active` (dashboard access)
4. **Cancels Later**: Gets `free` + `active` (reverted to unpaid)

This ensures unpaid users are properly restricted while paid users (including $149/month starter) get full access.
