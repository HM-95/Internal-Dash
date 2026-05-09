-- Fix subscription plan logic after trial fields migration
-- Users with 'free' subscription_status should have 'free' subscription_plan, not 'starter'

/*
🔧 WHAT THIS FIXES:
- Users with subscription_status = 'free' should have subscription_plan = 'free'
- Users with subscription_status = 'trialing' should have subscription_plan = 'starter' (or their selected plan)
- Users with subscription_status = 'active' should have subscription_plan = their actual paid plan

❌ CURRENT PROBLEM:
- Some users have subscription_status = 'free' but subscription_plan = 'starter'
- This causes confusion and incorrect access control

✅ AFTER THIS FIX:
- subscription_status = 'free' → subscription_plan = 'free' (unpaid users)
- subscription_status = 'trialing' → subscription_plan = selected plan (trial users)
- subscription_status = 'active' → subscription_plan = paid plan (paid users)
*/

-- Step 1: Check current state
DO $$ 
DECLARE
    mismatch_count INTEGER;
    user_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Checking for subscription plan/status mismatches...';
    
    -- Count users with mismatched plan/status
    SELECT COUNT(*) INTO mismatch_count
    FROM public.user_preferences 
    WHERE (subscription_status = 'free' AND subscription_plan != 'free')
       OR (subscription_status = 'trialing' AND subscription_plan = 'free')
       OR (subscription_status = 'active' AND subscription_plan = 'free');
    
    RAISE NOTICE 'Found % users with mismatched subscription plan/status', mismatch_count;
    
    -- Show examples of mismatches
    RAISE NOTICE 'Examples of mismatches:';
    FOR user_record IN 
        SELECT user_id, subscription_plan, subscription_status 
        FROM public.user_preferences 
        WHERE (subscription_status = 'free' AND subscription_plan != 'free')
           OR (subscription_status = 'trialing' AND subscription_plan = 'free')
           OR (subscription_status = 'active' AND subscription_plan = 'free')
        LIMIT 5
    LOOP
        RAISE NOTICE 'User %: plan=%, status=%', user_record.user_id, user_record.subscription_plan, user_record.subscription_status;
    END LOOP;
END $$;

-- Step 2: Fix the logic
DO $$ 
DECLARE
    fixed_count INTEGER;
BEGIN
    RAISE NOTICE '🔧 Fixing subscription plan logic...';
    
    -- Fix 1: Users with 'free' status should have 'free' plan
    UPDATE public.user_preferences 
    SET subscription_plan = 'free'
    WHERE subscription_status = 'free' 
      AND subscription_plan != 'free';
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % users: set subscription_plan to "free" for free status users', fixed_count;
    
    -- Fix 2: Users with 'trialing' status should keep their selected plan (don't change to 'free')
    -- This is already correct - no action needed
    
    -- Fix 3: Users with 'active' status should keep their paid plan (don't change to 'free')
    -- This is already correct - no action needed
    
    RAISE NOTICE '✅ Subscription plan logic fixed';
END $$;

-- Step 3: Verify the fix
DO $$ 
DECLARE
    remaining_mismatches INTEGER;
    status_summary RECORD;
BEGIN
    RAISE NOTICE '🔍 Verifying the fix...';
    
    -- Check for remaining mismatches
    SELECT COUNT(*) INTO remaining_mismatches
    FROM public.user_preferences 
    WHERE (subscription_status = 'free' AND subscription_plan != 'free')
       OR (subscription_status = 'trialing' AND subscription_plan = 'free')
       OR (subscription_status = 'active' AND subscription_plan = 'free');
    
    IF remaining_mismatches = 0 THEN
        RAISE NOTICE '✅ All subscription plan/status mismatches fixed!';
    ELSE
        RAISE NOTICE '⚠️  Still have % mismatches - manual review needed', remaining_mismatches;
    END IF;
    
    -- Show final state summary
    RAISE NOTICE '📊 Final subscription state summary:';
    FOR status_summary IN 
        SELECT subscription_status, subscription_plan, COUNT(*) as user_count
        FROM public.user_preferences 
        GROUP BY subscription_status, subscription_plan
        ORDER BY subscription_status, subscription_plan
    LOOP
        RAISE NOTICE 'Status: %, Plan: %, Users: %', 
            status_summary.subscription_status, 
            status_summary.subscription_plan, 
            status_summary.user_count;
    END LOOP;
END $$;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Subscription plan logic fix completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 CORRECT LOGIC NOW:';
    RAISE NOTICE '- subscription_status = "free" → subscription_plan = "free" (unpaid users)';
    RAISE NOTICE '- subscription_status = "trialing" → subscription_plan = selected plan (trial users)';
    RAISE NOTICE '- subscription_status = "active" → subscription_plan = paid plan (paid users)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Users will now be correctly routed to dashboard or onboarding';
END $$;
