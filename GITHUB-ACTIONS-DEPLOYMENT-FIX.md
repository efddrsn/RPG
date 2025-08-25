# GitHub Actions Deployment Fix Guide

## Problem Fixed
The GitHub Actions workflow was failing with:
```
remote: Permission to efddrsn/RPG.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/efddrsn/RPG.git/': The requested URL returned error: 403
```

## Changes Made

### 1. Updated Workflow Permissions
Changed `.github/workflows/inject-secrets.yml`:
- Changed `contents: read` to `contents: write` to allow pushing to gh-pages branch
- Added `publish_branch: gh-pages` and `force_orphan: true` for better deployment handling

## Additional Steps You May Need

### 2. Repository Settings (Manual Steps)

#### Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Choose **gh-pages** branch and **/ (root)** folder
6. Click **Save**

#### Configure GitHub Actions Permissions
1. In repository **Settings**
2. Go to **Actions** → **General**
3. Under **Workflow permissions**, ensure:
   - ✅ **Read and write permissions** is selected
   - ✅ **Allow GitHub Actions to create and approve pull requests** is checked
4. Click **Save**

### 3. Alternative Token Solution (If Still Failing)

If the issue persists, you may need to use a Personal Access Token:

1. **Create a Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` and `workflow` permissions

2. **Add to Repository Secrets:**
   - Go to repository Settings → Secrets and variables → Actions
   - Add new secret named `PAT_TOKEN` with your personal access token

3. **Update workflow to use PAT:**
   ```yaml
   - name: Deploy to GitHub Pages
     uses: peaceiris/actions-gh-pages@v4
     with:
       personal_token: ${{ secrets.PAT_TOKEN }}  # Instead of github_token
       publish_dir: ./
       publish_branch: gh-pages
       keep_files: true
       force_orphan: true
   ```

## Test the Fix

1. **Commit and push the changes:**
   ```bash
   git add .github/workflows/inject-secrets.yml
   git commit -m "Fix GitHub Actions deployment permissions"
   git push origin main
   ```

2. **Monitor the workflow:**
   - Go to **Actions** tab in your repository
   - Watch the "Deploy with Secrets" workflow run
   - Check for successful deployment

## Expected Result

After these changes, your GitHub Actions workflow should:
- ✅ Successfully inject secrets into your configuration
- ✅ Deploy to the `gh-pages` branch without permission errors
- ✅ Make your RPG application available at `https://efddrsn.github.io/RPG/`

## Troubleshooting

If you still encounter issues:
1. Check that both `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` are properly set in repository secrets
2. Verify that GitHub Pages is enabled and pointing to the `gh-pages` branch
3. Ensure the repository has public visibility (required for GitHub Pages on free accounts)
4. Try the Personal Access Token solution mentioned above

## Notes

- The workflow now has `contents: write` permission to push to gh-pages
- Added `force_orphan: true` to ensure clean deployments
- The `keep_files: true` option preserves existing files during deployment