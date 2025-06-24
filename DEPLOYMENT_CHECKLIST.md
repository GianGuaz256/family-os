# Family OS Production Deployment Checklist

## 🚀 Pre-Deployment Setup

### 1. Environment Variables
- [ ] Copy `env.production.example` to `.env.production`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to your Supabase project URL
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase anonymous key
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain: `https://family.themewfi.xyz`
- [ ] Set `OPENAI_API_KEY` if using card analysis features
- [ ] Set `NODE_ENV=production`

### 2. Supabase Configuration
- [ ] **Authentication Settings**
  - Go to Supabase Dashboard → Authentication → URL Configuration
  - Set **Site URL** to: `https://family.themewfi.xyz`
  - Add **Redirect URLs**:
    - `https://family.themewfi.xyz/auth/callback`
    - `https://family.themewfi.xyz/invite/*` (for invite flows)
  - **Remove** any localhost URLs from redirect URLs

- [ ] **Email Templates**
  - Go to Supabase Dashboard → Authentication → Email Templates
  - In **Confirm signup** template, ensure `{{ .SiteURL }}` is used (not hardcoded URLs)
  - In **Reset password** template, ensure `{{ .SiteURL }}` is used
  - In **Change email address** template, ensure `{{ .SiteURL }}` is used

### 3. Database Setup
- [ ] Run all SQL scripts in `/scripts/` directory:
  - `setup-database.sql` (base tables)
  - `enhance-documents-storage.sql` (document storage)
  - `add-subscriptions-table.sql` (subscriptions)
  - `migrate-events.sql` (events)
  - `fix-family-deletion.sql` (family deletion)
  - `fix-invite-rls.sql` (invite RLS)
  - `add-family-icon.sql` (family icons)

### 4. Domain Configuration
- [ ] Ensure your domain `family.themewfi.xyz` points to your deployment
- [ ] SSL certificate is properly configured
- [ ] HTTPS is enforced

## 📧 Email Configuration Issues

### If signup emails point to localhost:

1. **Check Supabase Auth Settings**:
   ```bash
   # Verify your Site URL in Supabase Dashboard
   Site URL: https://family.themewfi.xyz
   ```

2. **Verify Environment Variables**:
   ```bash
   # In your .env.production file
   NEXT_PUBLIC_SITE_URL=https://family.themewfi.xyz
   ```

3. **Check Email Templates**:
   - Supabase Dashboard → Authentication → Email Templates
   - Confirm signup template should use: `{{ .SiteURL }}/auth/callback`
   - NOT: `http://localhost:3000/auth/callback`

4. **Clear Supabase Cache**:
   - Save the authentication settings again
   - Test with a new email address

## 🔧 Deployment Commands

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Testing Checklist

### Authentication Testing
- [ ] Sign up with new email - verify email goes to correct domain
- [ ] Email confirmation works and redirects to production URL
- [ ] Password reset works with correct URLs
- [ ] Login works correctly
- [ ] Logout works correctly

### Family Functionality
- [ ] Create family works
- [ ] Join family with invite code works
- [ ] Invite links generate with correct domain
- [ ] Family management works

### PWA Testing
- [ ] Service worker registers correctly
- [ ] App can be installed on mobile devices
- [ ] Offline functionality works
- [ ] Push notifications work (if implemented)

## 🐛 Troubleshooting

### Email URLs pointing to localhost
**Problem**: Signup confirmation emails contain localhost URLs instead of production domain.

**Solutions**:
1. **Check Supabase Site URL**: Must be set to `https://family.themewfi.xyz`
2. **Verify Environment Variable**: `NEXT_PUBLIC_SITE_URL=https://family.themewfi.xyz`
3. **Clear Browser Cache**: Old settings might be cached
4. **Test with New Email**: Use a fresh email address that hasn't been used before

### Authentication Redirects Not Working
**Problem**: After email confirmation, redirects don't work properly.

**Solutions**:
1. **Check Redirect URLs**: Add all necessary URLs to Supabase auth settings
2. **Verify Callback Handler**: Ensure `/auth/callback` page exists and works
3. **Check URL Patterns**: Ensure wildcard patterns like `/invite/*` are properly configured

### Environment Variables Not Loading
**Problem**: Production environment variables aren't being loaded.

**Solutions**:
1. **File Location**: Ensure `.env.production` is in the root directory
2. **Docker Configuration**: Check if environment variables are passed to container
3. **Next.js Prefix**: Ensure client-side variables have `NEXT_PUBLIC_` prefix

## 📋 Post-Deployment Verification

- [ ] Application loads correctly at `https://family.themewfi.xyz`
- [ ] All static assets load over HTTPS
- [ ] Authentication flow works end-to-end
- [ ] Email confirmations work with correct URLs
- [ ] Database operations work correctly
- [ ] Real-time subscriptions work
- [ ] PWA features work (installation, offline mode)

## 🔐 Security Checklist

- [ ] All environment variables are properly secured
- [ ] Supabase RLS policies are enabled and tested
- [ ] HTTPS is enforced
- [ ] No sensitive data in client-side code
- [ ] API keys are properly scoped
- [ ] CORS settings are properly configured

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs for authentication issues
3. Verify all environment variables are set correctly
4. Test with a clean browser session/incognito mode
5. Check Docker logs if using containerized deployment

---

**Note**: The main cause of localhost URLs in emails is usually the Supabase Site URL configuration. Always verify this setting first when encountering email redirect issues. 