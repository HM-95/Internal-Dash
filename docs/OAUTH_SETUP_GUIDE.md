# 🔧 OAuth Redirect Fix Guide

## 🚨 **Current Issue**
Google OAuth is redirecting to `https://app.buzzberry.io` instead of `http://localhost:3000`

## ✅ **Solution Options**

### **Option 1: Update Supabase OAuth Settings (Recommended)**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `your_supabase_project_id`
3. **Navigate to**: Authentication → Settings → URL Configuration
4. **Update these settings**:

```
Site URL: http://localhost:3000
Redirect URLs: 
- http://localhost:3000/auth/callback
- https://app.buzzberry.io/auth/callback
```

### **Option 2: Use Local OAuth Callback (Already Implemented)**

I've already created a local OAuth callback handler at `/app/auth/callback/route.ts` and updated the Google sign-in to use it.

## 🧪 **Test the Fix**

1. **Restart your dev server**: `npm run dev`
2. **Try Google OAuth again**
3. **Should now redirect to**: `http://localhost:3000/auth/callback` → `http://localhost:3000`

## 🔄 **Production vs Development**

- **Development**: `http://localhost:3000`
- **Production**: `https://app.buzzberry.io`

The OAuth settings should include both URLs to work in both environments.

## 🎯 **Expected Flow**

1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. Google redirects to: `http://localhost:3000/auth/callback?code=...`
4. Callback handler processes the code
5. User is redirected to: `http://localhost:3000`
6. Auth flow continues normally

---

**Try the Google OAuth again after updating the Supabase settings! 🚀** 