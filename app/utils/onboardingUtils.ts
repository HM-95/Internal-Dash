import { UserPreferences } from '@/types/userPreferences';

/**
 * Check if a user needs to complete onboarding
 * @param preferences - User preferences object
 * @returns boolean - true if onboarding is needed, false if completed
 */
export function needsOnboarding(preferences: UserPreferences | null): boolean {
  if (!preferences) {
    return true; // No preferences exist, needs onboarding
  }
  
  return !preferences.onboarding_completed;
}

/**
 * Check if a user has completed onboarding
 * @param preferences - User preferences object
 * @returns boolean - true if onboarding is completed, false if needed
 */
export function hasCompletedOnboarding(preferences: UserPreferences | null): boolean {
  return !needsOnboarding(preferences);
}

/**
 * Check if user has valid preferences for AI recommendations
 * @param preferences - User preferences object
 * @returns boolean - true if preferences are valid for AI recommendations
 */
export function hasValidAIPreferences(preferences: UserPreferences | null): boolean {
  if (!preferences) {
    return false;
  }
  
  return (
    preferences.onboarding_completed &&
    preferences.selected_niches.length > 0 &&
    preferences.target_audience_description !== null &&
    preferences.target_audience_description.trim().length > 0
  );
}

/**
 * Get onboarding completion percentage
 * @param preferences - User preferences object
 * @returns number - percentage of onboarding completion (0-100)
 */
export function getOnboardingProgress(preferences: UserPreferences | null): number {
  if (!preferences) {
    return 0;
  }
  
  if (preferences.onboarding_completed) {
    return 100;
  }
  
  let progress = 0;
  
  // Check if niches are selected
  if (preferences.selected_niches && preferences.selected_niches.length > 0) {
    progress += 50;
  }
  
  // Check if target audience description is provided
  if (preferences.target_audience_description !== null && preferences.target_audience_description.trim().length > 0) {
    progress += 50;
  }
  
  return progress;
}

/**
 * Get missing onboarding steps
 * @param preferences - User preferences object
 * @returns string[] - array of missing steps
 */
export function getMissingOnboardingSteps(preferences: UserPreferences | null): string[] {
  const missingSteps: string[] = [];
  
  if (!preferences) {
    missingSteps.push('Select preferred niches');
    missingSteps.push('Describe target audience');
    return missingSteps;
  }
  
  if (!preferences.selected_niches || preferences.selected_niches.length === 0) {
    missingSteps.push('Select preferred niches');
  }
  
  if (preferences.target_audience_description === null || preferences.target_audience_description.trim().length === 0) {
    missingSteps.push('Describe target audience');
  }
  
  return missingSteps;
}

/**
 * Format onboarding progress for display
 * @param progress - progress percentage (0-100)
 * @returns string - formatted progress text
 */
export function formatOnboardingProgress(progress: number): string {
  if (progress === 0) {
    return 'Not started';
  } else if (progress === 100) {
    return 'Completed';
  } else {
    return `${progress}% complete`;
  }
}
