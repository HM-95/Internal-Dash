'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface PasswordStrength {
  score: number;
  level: string;
  feedback: string[];
  isValid: boolean;
}

export function usePasswordChange() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    // Simple password strength checker
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include at least one lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include at least one uppercase letter');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include at least one number');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include at least one special character');

    let level = 'weak';
    if (score >= 4) level = 'strong';
    else if (score >= 3) level = 'medium';
    else if (score >= 2) level = 'weak';

    setPasswordStrength({
      score,
      level,
      feedback,
      isValid: score >= 3
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentPassword || !newPassword) {
      setError('Current password and new password are required');
      return false;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use Supabase auth to change password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validatePasswords = (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const errors: string[] = [];

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword) {
      errors.push('New password is required');
    } else if (newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    }

    if (!confirmPassword) {
      errors.push('Please confirm your new password');
    } else if (newPassword !== confirmPassword) {
      errors.push('New passwords do not match');
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }

    return errors;
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    loading,
    error,
    success,
    passwordStrength,
    changePassword,
    checkPasswordStrength,
    validatePasswords,
    clearMessages,
    setError
  };
}
