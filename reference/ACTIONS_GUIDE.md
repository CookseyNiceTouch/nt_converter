# GitHub Actions Build Guide

## Overview

This repository uses GitHub Actions to automatically build your Electron application whenever you push code or create a release.

## The Workflow File

**Location**: `.github/workflows/build-electron.yml`

## When Does It Run?

The build workflow automatically triggers when:

1. **Push to `main` or `develop` branches** - Builds automatically verify your code
2. **Pull Requests** - Ensures PRs don't break the build
3. **Manual trigger** - You can run it manually from GitHub UI
4. **Creating a release** - Automatically builds and attaches installers to releases

## How to Use

### Option 1: Automatic Build on Push

Simply push your code:
```bash
git add .
git commit -m "Your changes"
git push origin develop
```

Then:
1. Go to your GitHub repository
2. Click the **"Actions"** tab
3. You'll see your workflow running
4. Wait for it to complete (usually 10-20 minutes)
5. Download artifacts from the completed run

### Option 2: Manual Trigger

1. Go to GitHub → Actions tab
2. Click "Build Electron App" workflow
3. Click "Run workflow" button
4. Select branch
5. Click "Run workflow"

### Option 3: Create a Release (Recommended for Distribution)

1. Go to GitHub → Releases
2. Click "Draft a new release"
3. Create a new tag (e.g., `v0.1.0`)
4. Add release notes
5. Click "Publish release"
6. The workflow will automatically build and attach the installer files to the release

## Viewing Build Results

### Download Artifacts

1. Go to Actions tab
2. Click on a completed workflow run
3. Scroll down to "Artifacts" section
4. Click "electron-windows-installer" to download

### What Gets Built

- **Nice Touch-Windows-{version}-Setup.msi** - The main installer
- **latest.yml** - Update metadata file

## Build Process

The workflow performs these steps:
1. ✅ Checkout code
2. ✅ Setup Node.js 22.15.0
3. ✅ Setup Python 3.12
4. ✅ Install `uv` package manager
5. ✅ Install all Node dependencies
6. ✅ Install Python dependencies
7. ✅ Generate Prisma client
8. ✅ Build Electron app (Python services → Backend → Electron)
9. ✅ Upload build artifacts
10. ✅ (If release) Attach to GitHub release

## Troubleshooting

### Build Fails

1. Check the Actions tab for error messages
2. Common issues:
   - Missing dependencies in `package.json` or `pyproject.toml`
   - Environment variables needed (add as GitHub Secrets)
   - Syntax errors in code

### Adding Secrets

If your build needs API keys or certificates:

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

### Build Takes Too Long

- Current timeout: GitHub allows up to 6 hours per job
- Typical build time: 10-20 minutes
- If consistently timing out, check for infinite loops or issues

## Customization

### Change Trigger Branches

Edit `.github/workflows/build-electron.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop
      - feature/my-branch  # Add your branch
```

### Change Build Command

Edit the "Build Electron App" step:

```yaml
- name: Build Electron App
  run: npm run electron:build:debug  # Use debug build instead
```

### Add More Operating Systems

Currently builds for Windows only. To add Mac/Linux, see the multi-platform workflow example in the documentation.

## Cost

GitHub Actions is free for public repositories. For private repos:
- Free tier: 2,000 minutes/month
- Windows builds: 1 minute of build time = 2 minutes of quota
- Typical build: ~20 minutes = 40 minutes of quota

## Questions?

If you need help with GitHub Actions, check:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Builder CI Documentation](https://www.electron.build/configuration/configuration#Configuration-ci)

