-- Migration to clean up any potential duplicate subscriptions
-- This should be run after deploying the new subscription management system

-- Step 1: Add past_due as a valid subscription status if not already included
DO $$ 
BEGIN
    -- Drop the existing constraint to modify it
    ALTER TABLE public.user_preferences 
    DROP CONSTRAINT IF EXISTS user_preferences_subscription_status_check;
    
    -- Add new constraint that includes 'past_due' status
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_subscription_status_check 
    CHECK (subscription_status = ANY(ARRAY['active'::text, 'cancelled'::text, 'past_due'::text, 'trialing'::text]));
    
    RAISE NOTICE 'Updated subscription_status constraint to include past_due';
END $$;

-- Step 2: Log any users who might have issues (for manual review)
-- This query helps identify users who might need manual cleanup
SELECT 
    user_id,
    subscription_plan,
    subscription_status,
    stripe_subscription_id,
    stripe_customer_id,
    created_at,
    updated_at,
    CASE 
        WHEN subscription_plan != 'free' AND stripe_subscription_id IS NULL THEN 'Missing Stripe subscription ID'
        WHEN subscription_plan = 'free' AND stripe_subscription_id IS NOT NULL THEN 'Has Stripe ID but free plan'
        WHEN subscription_status NOT IN ('active', 'trialing', 'cancelled', 'past_due') THEN 'Invalid status'
        ELSE 'OK'
    END as potential_issue
FROM public.user_preferences 
WHERE 
    -- Find potentially problematic records
    (subscription_plan != 'free' AND stripe_subscription_id IS NULL) OR
    (subscription_plan = 'free' AND stripe_subscription_id IS NOT NULL) OR
    (subscription_status NOT IN ('active', 'trialing', 'cancelled', 'past_due'))
ORDER BY created_at DESC;

-- Step 3: Clean up any obviously incorrect records
-- Users with 'free' plan but having Stripe subscription IDs (likely old data)
UPDATE public.user_preferences 
SET 
    stripe_subscription_id = NULL,
    trial_start_date = NULL,
    trial_end_date = NULL,
    updated_at = NOW()
WHERE 
    subscription_plan = 'free' 
    AND stripe_subscription_id IS NOT NULL
    AND subscription_status = 'active';

-- Step 4: Add indexes for better performance on subscription queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription_lookup 
ON public.user_preferences (user_id, subscription_status, subscription_plan);

CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_subscription 
ON public.user_preferences (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Step 5: Add a comment explaining the new subscription management approach
COMMENT ON COLUMN public.user_preferences.subscription_status IS 
'Subscription status: active (paid and current), trialing (in trial period), past_due (payment failed but still has access), cancelled (no longer has access)';

COMMENT ON COLUMN public.user_preferences.subscription_plan IS 
'Subscription plan: free (no payment), starter ($149/month), pro ($199/month), agency ($599/month)';

-- Final verification query
SELECT 
    subscription_plan,
    subscription_status,
    COUNT(*) as user_count,
    COUNT(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 END) as with_stripe_id,
    COUNT(CASE WHEN stripe_customer_id IS NOT NULL THEN 1 END) as with_customer_id
FROM public.user_preferences 
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;
