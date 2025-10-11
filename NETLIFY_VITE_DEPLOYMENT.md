# Netlify Deployment Guide for Vite Migration

## 🎉 Build Performance Improvement

After migrating from Create React App (CRA) with Webpack to Vite, we achieved significant build performance improvements:

- **Previous build time (CRA/Webpack):** 25.52 seconds
- **New build time (Vite):** 7.07 seconds
- **Improvement:** 72% faster (3.6x speed increase)

Additionally, development server startup is now nearly instant with Hot Module Replacement (HMR) working in milliseconds instead of seconds.

## 📋 Required Netlify Configuration Changes

### Build Command

**⚠️ IMPORTANT: You need to update the build command in Netlify:**

```
npm install --legacy-peer-deps && npm run build
```

This is required because Vite 7 has peer dependency conflicts with older @types/node versions. The `--legacy-peer-deps` flag allows npm to install despite these conflicts.

### Build Settings in Netlify

Update your Netlify site with the following settings:

1. **Base directory:** (leave empty or set to root `/`)
2. **Build command:** `npm install --legacy-peer-deps && npm run build`
3. **Publish directory:** `build`
4. **Node version:** 18 or higher (recommended: 22.18.0)

**How to update in Netlify:**
1. Go to your site in Netlify Dashboard
2. Navigate to: Site Settings → Build & deploy → Continuous deployment → Build settings
3. Click "Edit settings"
4. Update "Build command" to: `npm install --legacy-peer-deps && npm run build`
5. Save changes

### Setting Node Version (Optional but Recommended)

To ensure consistent builds, create or update your `.nvmrc` file in the project root:

```bash
22.18.0
```

Or add this to your `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "22.18.0"
```

## 🔧 Environment Variables

All your existing environment variables will continue to work. Vite uses the same `.env` file format as Create React App.

**Important:** Make sure your Netlify environment variables are still set:
- `REACT_APP_*` variables will work as before
- Vite also supports `VITE_*` prefix, but you don't need to change anything

## 🚀 Deployment Process

### First-Time Vite Deployment

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "chore: Migrate from CRA to Vite for faster builds"
   git push origin <your-branch>
   ```

2. **Netlify will automatically:**
   - Detect the new `package.json` with Vite dependencies
   - Run `npm install` (this may take longer the first time due to new dependencies)
   - Run `npm run build` (which now uses Vite)
   - Deploy the built files from the `build/` directory

3. **Monitor the deployment:**
   - Check the build logs in Netlify dashboard
   - Build should complete in ~7-10 seconds (vs previous 25+ seconds)
   - Look for: `✓ built in X.XXs` in the logs

### Troubleshooting

#### If build fails with "vite: command not found"

This shouldn't happen, but if it does:

1. Clear Netlify build cache:
   - Go to Site Settings → Build & deploy → Build settings
   - Click "Clear build cache"
   - Trigger a new deployment

2. Check that these packages are in `package.json` devDependencies:
   ```json
   {
     "devDependencies": {
       "vite": "^7.1.9",
       "@vitejs/plugin-react": "^5.0.4",
       "vite-plugin-env-compatible": "^2.0.1",
       "vite-tsconfig-paths": "^5.1.4"
     }
   }
   ```

#### If npm install fails with peer dependency errors

If you see errors like:
```
npm error ERESOLVE could not resolve
npm error While resolving: vite@7.1.9
npm error Found: @types/node@16.18.119
```

**Solution:** You need to use the `--legacy-peer-deps` flag:

**Option 1: Update Build Command (RECOMMENDED)**
In Netlify dashboard, change build command to:
```
npm install --legacy-peer-deps && npm run build
```

**Option 2: Use netlify.toml**
Create or update `netlify.toml` in your project root:
```toml
[build]
  command = "npm install --legacy-peer-deps && npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "22.18.0"
```

#### CSS @import warnings

You may see warnings like:
```
[postcss] @import must precede all other statements
```

These are warnings, not errors. The build will still succeed. To fix them (optional), move all `@import` statements to the top of your CSS files before any other CSS rules.

## 📊 Expected Build Output

Your successful Vite build should show:
```
✓ 2479 modules transformed.
build/index.html                           1.54 kB │ gzip:   0.67 kB
build/assets/index-S0zBoxYq.css           82.98 kB │ gzip:  14.97 kB
build/assets/ui-vendor-B2V9Cx9F.js        92.37 kB │ gzip:  31.09 kB
build/assets/supabase-kreR9gVS.js        116.12 kB │ gzip:  32.01 kB
build/assets/google-genai-BgJ0ueUP.js    149.65 kB │ gzip:  25.32 kB
build/assets/react-vendor-CPpI7ooe.js    177.61 kB │ gzip:  58.58 kB
build/assets/index-BwCOZKuH.js         1,513.39 kB │ gzip: 412.78 kB
✓ built in 5.94s
```

## 🎯 Benefits of Vite Migration

1. **Faster builds:** 7 seconds vs 25 seconds (72% improvement)
2. **Instant HMR:** Changes reflect in <100ms during development
3. **Faster dev server startup:** <2 seconds vs 10+ seconds
4. **Better tree-shaking:** Smaller bundle sizes in some cases
5. **Modern tooling:** esbuild-powered builds instead of Webpack

## 🔄 Rollback Instructions (If Needed)

If you need to rollback to the old CRA/Webpack build system:

1. Restore the old package.json scripts:
   ```json
   {
     "scripts": {
       "start": "craco start",
       "build": "craco build"
     }
   }
   ```

2. Or use the backup build command we kept:
   ```bash
   npm run build:legacy
   ```

3. Deploy and let Netlify rebuild with the old system

## ✅ Verification Checklist

After deploying to Netlify, verify:

- [ ] Build completes successfully in ~7-10 seconds
- [ ] Site loads correctly at your Netlify URL
- [ ] All routes work (React Router)
- [ ] Environment variables are working
- [ ] WebSocket connections work (Gemini Live API)
- [ ] All assets load (images, Rive animations, videos)
- [ ] Authentication works (Kinde)
- [ ] Database connections work (Supabase)

## 📝 Additional Notes

### What Changed
- ✅ Build system: Webpack → Vite
- ✅ Dev server: webpack-dev-server → vite dev server
- ✅ Module bundling: Webpack → Rollup (Vite's production bundler)
- ✅ TypeScript compilation: ts-loader → esbuild
- ⚠️ Config file: `craco.config.js` → `vite.config.ts`

### What Stayed the Same
- ✅ React 18.3.1
- ✅ TypeScript 5.6.3
- ✅ All dependencies and libraries
- ✅ Build output directory (`build/`)
- ✅ Environment variables
- ✅ Deployment process

### Performance Metrics

| Metric | CRA/Webpack | Vite | Improvement |
|--------|-------------|------|-------------|
| Cold build | 25.52s | 7.07s | **72% faster** |
| Dev server start | ~10s | ~2s | **80% faster** |
| HMR (Hot Module Replacement) | 1-3s | <100ms | **95% faster** |
| Bundle size | Similar | Similar | ~Same |

## 🆘 Support

If you encounter any issues during deployment:

1. Check Netlify build logs for specific errors
2. Verify all environment variables are set
3. Try clearing Netlify build cache
4. Check that Node.js version is 18 or higher
5. Refer to the troubleshooting section above

---

**Migration completed:** October 11, 2025  
**Vite version:** 7.1.9  
**Previous build time:** 25.52s  
**New build time:** 7.07s  
**Improvement:** 3.6x faster (72% reduction)
