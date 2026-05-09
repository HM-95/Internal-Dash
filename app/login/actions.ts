"use server"
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createServerActionClient({ cookies })

  // Try sign in first
  const signInResult = await supabase.auth.signInWithPassword({ email, password })
  
  if (signInResult.error && signInResult.error.message.toLowerCase().includes('invalid login credentials')) {
    // Try sign up if user not found
    const signUpResult = await supabase.auth.signUp({ email, password })
    return { data: signUpResult.data, error: signUpResult.error }
  }
  
  return { data: signInResult.data, error: signInResult.error }
} 