# Stripe Integration Setup Guide

This guide will help you set up Stripe integration for the Buzzberry Dashboard.

## 🎯 **What's Already Implemented**

### ✅ **Backend Infrastructure**
- **Stripe Package**: `stripe: ^18.4.0` installed
- **API Routes**: 
  - `/api/stripe/create-checkout-session` - Creates checkout sessions
  - `/api/stripe/webhooks` - Handles webhook events
- **Database Schema**: `stripe_customer_id` and `stripe_subscription_id` columns in `user_preferences` table
- **Frontend Hook**: `useStripeCheckout` hook for checkout functionality
- **UI Integration**: Settings modal pricing page with Stripe checkout buttons

### ✅ **Features Ready**
- **Checkout Sessions**: Create Stripe checkout for all three plans
- **Webhook Handling**: Process subscription events, payment success/failure
- **User Management**: Create/update Stripe customers
- **Plan Management**: Update user subscription plans in database
- **Usage Tracking**: Reset usage counters on successful payments

## 🔧 **Setup Required**

### **Step 1: Environment Variables**

Add these to your `.env.local` file:

```env
# Stripe Configuration (REQUIRED)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 2: Get Your Stripe Keys**

1. **Create Stripe Account**: Sign up at https://stripe.com
2. **Get API Keys**: 
   - Go to **Developers** > **API keys**
   - Copy **Publishable key** and **Secret key**
   - Use test keys for development

### **Step 3: Set Up Webhooks**

1. **In Stripe Dashboard**: Go to **Developers** > **Webhooks**
2. **Add Endpoint**: 
   - URL: `https://your-domain.com/api/stripe/webhooks`
   - For local testing: Use Stripe CLI
3. **Select Events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy Webhook Secret**: Add to your environment variables

### **Step 4: Test the Integration**

1. **Start Development Server**: `npm run dev`
2. **Open Settings Modal**: Navigate to Pricing tab
3. **Test Checkout**: Click "Try for Free" on any plan
4. **Verify Webhooks**: Check Stripe Dashboard for webhook delivery

## 💳 **Pricing Plans Configuration**

The system is configured for these plans:

| Plan | Monthly | Annual | Imports | Exports | AI Searches |
|------|---------|--------|---------|---------|-------------|
| Starter | $149 | $134 | 100 | 50 | Limited |
| Pro | $199 | $179 | 2,000 | 500 | Unlimited |
| Agency | $599 | $539 | 7,500 | 2,000 | Unlimited |

## 🔄 **How It Works**

### **Checkout Flow**
1. User clicks "Try for Free" on a plan
2. `useStripeCheckout` hook calls `/api/stripe/create-checkout-session`
3. API creates Stripe customer (if new) and checkout session
4. User is redirected to Stripe Checkout
5. After payment, user returns to dashboard

### **Webhook Processing**
1. Stripe sends webhook events to `/api/stripe/webhooks`
2. Webhook handler processes different event types:
   - **Checkout Completed**: Updates user plan in database
   - **Payment Succeeded**: Resets usage counters
   - **Subscription Updated**: Updates plan status
   - **Subscription Deleted**: Downgrades to starter plan

### **Database Updates**
- **User Preferences**: Updated with Stripe customer ID and subscription ID
- **Subscription Plan**: Updated based on webhook events
- **Usage Counters**: Reset monthly on successful payments

## 🚀 **Deployment Checklist**

### **For Vercel Deployment**
1. **Environment Variables**: Add all Stripe keys to Vercel
2. **Webhook URL**: Update to your production domain
3. **Domain Verification**: Ensure your domain is verified in Stripe
4. **SSL Certificate**: Required for webhook delivery

### **For Local Development**
1. **Stripe CLI**: Install for webhook forwarding
2. **Test Mode**: Use test keys and test cards
3. **Webhook Forwarding**: `stripe listen --forward-to localhost:3000/api/stripe/webhooks`

## 🧪 **Testing**

### **Test Cards**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### **Test Scenarios**
1. **New User**: First-time subscription
2. **Existing User**: Plan upgrade/downgrade
3. **Payment Failure**: Test declined cards
4. **Webhook Events**: Verify database updates

## 🔒 **Security Considerations**

- **Secret Keys**: Never expose in client-side code
- **Webhook Signatures**: Always verified in webhook handler
- **Environment Variables**: Use secure storage
- **HTTPS**: Required for production webhooks

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Invalid signature" error**
   - Check webhook secret is correct
   - Verify webhook URL is accessible

2. **Checkout not loading**
   - Verify publishable key is correct
   - Check browser console for errors

3. **Webhook not receiving events**
   - Ensure endpoint URL is correct
   - Check Stripe Dashboard webhook logs

4. **Database not updating**
   - Verify Supabase connection
   - Check webhook handler logs

### **Debug Steps**
1. Check browser console for client errors
2. Monitor server logs for API errors
3. Review Stripe Dashboard webhook logs
4. Verify environment variables are loaded

## 📞 **Support**

For issues with this integration:
1. Check Stripe documentation
2. Review webhook logs in Stripe Dashboard
3. Check browser console for client-side errors
4. Monitor server logs for API errors

## 🔄 **Next Steps**

### **Future Enhancements**
- [ ] Stripe Customer Portal integration
- [ ] Email notifications for payment events
- [ ] Advanced usage analytics
- [ ] Subscription management UI
- [ ] Proration handling for plan changes

### **Production Considerations**
- [ ] Switch to live Stripe keys
- [ ] Set up proper error monitoring
- [ ] Implement retry logic for webhooks
- [ ] Add comprehensive logging
- [ ] Set up monitoring alerts
