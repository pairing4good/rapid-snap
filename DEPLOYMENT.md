# 🚀 Deploying to GitHub Pages

This guide will help you deploy your camera app to GitHub Pages so you can access it from anywhere with HTTPS support.

## Prerequisites

- A GitHub account
- Git installed on your computer
- Your app code ready to deploy

## Deployment Options

You have two options for deploying to GitHub Pages:

### Option 1: Automatic Deployment (Recommended)

This uses GitHub Actions to automatically build and deploy whenever you push code.

### Option 2: Manual Deployment

Deploy manually using a single command.

---

## Option 1: Automatic Deployment with GitHub Actions

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** button (top right) → **New repository**
3. Name your repository (e.g., `photo-app`)
4. Choose **Public** (required for free GitHub Pages)
5. Click **Create repository**

### Step 2: Update the Base Path

Open `vite.config.js` and update the base path to match your repository name:

```javascript
base: process.env.NODE_ENV === 'production' ? '/rapid-snap/' : '/',
//                                                 ^^^^^^^^^^^^
//                                                 Change this to your repo name
```

If your repo is named `camera-app`, change it to `/camera-app/`

### Step 3: Push Your Code to GitHub

In your project folder, run these commands:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote (replace with YOUR username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Build and deployment**:
   - Source: Select **GitHub Actions**
5. The workflow will automatically run and deploy your app

### Step 5: Wait for Deployment

1. Go to the **Actions** tab in your repository
2. You'll see a workflow running
3. Wait for it to complete (usually 1-2 minutes)
4. Once complete, your app will be live!

### Step 6: Access Your App

Your app will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

For example:
- Username: `pairing4good`
- Repo: `rapid-snap`
- URL: `https://pairing4good.github.io/rapid-snap/`

**Important:** GitHub Pages provides automatic HTTPS, so the camera will work without any security warnings!

### Future Updates

Whenever you want to update your app:

```bash
git add .
git commit -m "Update app"
git push
```

GitHub Actions will automatically rebuild and redeploy!

---

## Option 2: Manual Deployment

If you prefer to deploy manually without GitHub Actions:

### Step 1: Create Repository (Same as Option 1)

Follow **Step 1** from Option 1 above.

### Step 2: Update Base Path (Same as Option 1)

Follow **Step 2** from Option 1 above.

### Step 3: Install gh-pages Package

```bash
npm install
```

### Step 4: Deploy

```bash
npm run deploy
```

This will:
1. Build your app
2. Create a `gh-pages` branch
3. Push the built files to GitHub
4. Enable GitHub Pages automatically

### Step 5: Enable GitHub Pages (if needed)

If deployment was successful but the site isn't live:

1. Go to repository **Settings** → **Pages**
2. Under **Branch**, select `gh-pages` and `/(root)`
3. Click **Save**

### Step 6: Access Your App

Your app will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

---

## Important Notes

### Camera Access on GitHub Pages

✅ **GitHub Pages provides HTTPS by default**, which means:
- No security warnings
- Camera access works immediately
- No need for self-signed certificates
- Works on all mobile browsers

### Repository Must Be Public

Free GitHub Pages only works with **public repositories**. If you need a private repo, you'll need:
- GitHub Pro account, or
- Use a different hosting service (Netlify, Vercel, etc.)

### Custom Domain (Optional)

You can use your own domain name:

1. Go to repository **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Follow GitHub's instructions to configure DNS

---

## Troubleshooting

### App shows 404 error

**Problem:** App loads but all pages show 404.

**Solution:** Check that the `base` path in `vite.config.js` matches your repository name exactly:
```javascript
base: '/YOUR_EXACT_REPO_NAME/',
```

### GitHub Actions workflow fails

**Problem:** Deployment workflow fails in Actions tab.

**Solution:** 
1. Make sure GitHub Pages is set to use "GitHub Actions" (not "Deploy from a branch")
2. Check that all dependencies are in `package.json`
3. Review the error logs in the Actions tab

### Camera doesn't work on deployed site

**Problem:** Camera access is denied on the live site.

**Solution:**
- GitHub Pages provides HTTPS automatically, so this shouldn't happen
- Clear your browser cache and try again
- Make sure you're accessing via `https://` not `http://`
- Check browser permissions for camera access

### Manual deployment: "gh-pages: command not found"

**Problem:** `npm run deploy` fails.

**Solution:**
```bash
npm install
npm run deploy
```

### Changes don't appear on the live site

**Problem:** You pushed changes but the site hasn't updated.

**Solution:**
- Wait 2-3 minutes for GitHub to rebuild
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check the Actions tab to see if deployment succeeded

---

## Alternative Hosting Services

If you prefer not to use GitHub Pages, these services also provide free HTTPS hosting:

### Netlify
1. Drag and drop your `dist` folder after running `npm run build`
2. Instant HTTPS
3. Continuous deployment from GitHub

### Vercel
1. Import your GitHub repository
2. Automatic HTTPS
3. Zero configuration needed

### Cloudflare Pages
1. Connect to GitHub
2. Automatic deployments
3. Fast global CDN

All of these work with the camera and provide HTTPS by default!

---

## Summary

**Recommended: Use GitHub Actions (Option 1)**
- ✅ Automatic deployments
- ✅ No manual steps after setup
- ✅ Free HTTPS
- ✅ Always up-to-date

**URL Format:**
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

**Update the base path in `vite.config.js` to match your repo name!**

---

Need help? Check the [GitHub Pages documentation](https://docs.github.com/en/pages) or open an issue in your repository.
