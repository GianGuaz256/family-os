# Build Fixes for Vercel Deployment

## Issues Fixed

### 1. PWA Configuration Issue
**Problem:** The `next.config.js` was using the old `next-pwa` package name, but the project had `@ducanh2912/next-pwa` installed.

**Solution:** Updated `next.config.js` to use the correct package:
```javascript
// Before
const withPWA = require("next-pwa")({...})

// After
const withPWA = require("@ducanh2912/next-pwa").default({...})
```

### 2. Sharp/Favicons Native Dependencies Issue
**Problem:** The `favicons` package (which depends on `sharp`) was being loaded at the top of `generate-icons.js`, causing the build to fail on Vercel due to missing native dependencies (`libvips-cpp.so.42`).

**Solution:** Implemented lazy-loading and early exit strategy:
1. **Check if icons exist first** - Before trying to load the `favicons` module, check if the icons are already generated
2. **Lazy-load favicons** - Only require the `favicons` module when actually needed to generate icons
3. **Graceful failure** - If the module can't be loaded, provide clear error messages

**Key changes in `scripts/generate-icons.js`:**
```javascript
// Check if icons already exist (skip generation on deployment)
try {
  await fs.access(path.join(iconsDir, 'favicon-32x32.png'));
  await fs.access(path.join(destDir, 'manifest.json'));
  console.log('✅ Icons already exist, skipping generation');
  return;
} catch {
  // Icons don't exist, proceed with generation
}

// Lazy-load favicons only when needed
let favicons;
try {
  favicons = require('favicons').favicons;
} catch (error) {
  console.error('❌ Cannot load favicons module:', error.message);
  console.error('💡 Make sure the public/icons directory is committed to git');
  process.exit(1);
}
```

## How It Works

### Local Development
1. Icons are generated once and committed to git
2. Subsequent builds skip icon generation since they already exist
3. To regenerate icons: delete `public/icons/` directory and run `yarn build`

### Vercel Deployment
1. Icons are pulled from git (already committed)
2. Build script checks if icons exist
3. Since icons exist, it skips generation entirely (avoiding the `sharp` dependency issue)
4. Build continues successfully with PWA configuration

## Files Modified

1. **next.config.js** - Updated PWA package reference and configuration
2. **scripts/generate-icons.js** - Added lazy-loading and early exit logic

## Testing

Build tested successfully with:
```bash
yarn build
```

Both scenarios tested:
- ✅ Icons exist (skips generation)
- ✅ Icons missing (generates them using `favicons`)

## Deployment Notes

- The `public/icons/` directory **must be committed** to git for Vercel builds to succeed
- The `favicons` package is only used during local development when icons need to be regenerated
- On Vercel, the build skips icon generation entirely, avoiding native dependency issues
