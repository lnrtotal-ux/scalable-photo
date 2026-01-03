# 🚀 Complete GitHub Deployment Guide for PhotoShare

This guide walks you through deploying PhotoShare to Azure App Service using GitHub and GitHub Actions.

## 📋 Prerequisites Checklist

Before starting, verify you have:

- [x] Azure resources created (handled)
- [x] Environment variables configured (handled)
- [x] GitHub account
- [x] Git installed on your machine
- [x] Local code ready to push

## 🔧 Part 1: GitHub Repository Setup

### Step 1.1: Initialize Git (if not already done)

```bash
cd "Scalable - Benjamin"
git init
```

### Step 1.2: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click **+** (top right) → **New repository**
3. Enter details:
   - **Repository name**: `scalable-photo`
   - **Description**: PhotoShare - Photo sharing platform
   - **Visibility**: Public
4. Click **Create repository**

### Step 1.3: Add Remote and Push Code

```bash
# Add the GitHub remote
git remote add origin https://github.com/lnrtotal-ux/scalable-photo.git

# Ensure you're on the main branch
git branch -M main

# Stage all files
git add .

# Commit
git commit -m "initial commit"

# Push to GitHub
git push -u origin main
```

**Note**: You may be prompted for GitHub authentication. Use:
- **Username**: Your GitHub username
- **Password**: Your GitHub personal access token (create at github.com/settings/tokens)

## 🔐 Part 2: Configure GitHub Secrets

GitHub Actions needs Azure credentials to deploy. Follow these steps:

### Step 2.1: Get Azure App Service Publish Profile

```bash
az webapp deployment list-publishing-profiles \
  --resource-group scalable-group \
  --name scalable-photo-app \
  --xml > publish-profile.xml

cat publish-profile.xml
```

Copy the entire XML content (it's long, include everything).

### Step 2.2: Get Storage Account Key

```bash
az storage account keys list \
  --resource-group scalable-group \
  --account-name scalablemediastorage \
  --query "[0].value" \
  -o tsv
```

Copy the key.

### Step 2.3: Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/lnrtotal-ux/scalable-photo
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** (left sidebar) → **Actions**
4. Click **New repository secret** (green button)

Add **two secrets**:

#### Secret 1: Azure Publish Profile
- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
- **Value**: Paste the entire XML from Step 2.1
- Click **Add secret**

#### Secret 2: Storage Account Key
- **Name**: `AZURE_STORAGE_ACCOUNT_KEY`
- **Value**: Paste the key from Step 2.2
- Click **Add secret**

Verify both secrets appear in the list with green checkmarks.

## 📊 Part 3: Database Initialization

The database needs to be initialized with tables and demo data.

### Option A: Using Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **SQL databases**
3. Click **scalable-db**
4. Click **Query editor** (left sidebar)
5. Login with:
   - **Username**: `scalableadmin`
   - **Password**: `scalable-admin-123!`

6. Run this SQL script:

```sql
-- PhotoShare Database Schema

-- Users Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    CREATE TABLE Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'consumer' CHECK (Role IN ('consumer', 'creator', 'admin')),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        INDEX IX_Users_Username (Username),
        INDEX IX_Users_Email (Email)
    )
END

-- Photos Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Photos')
BEGIN
    CREATE TABLE Photos (
        PhotoId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Caption NVARCHAR(1000),
        Location NVARCHAR(200),
        BlobUrl NVARCHAR(500) NOT NULL,
        ThumbnailUrl NVARCHAR(500),
        LikesCount INT NOT NULL DEFAULT 0,
        CommentsCount INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
        INDEX IX_Photos_UserId (UserId),
        INDEX IX_Photos_CreatedAt (CreatedAt DESC)
    )
END

-- Likes Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Likes')
BEGIN
    CREATE TABLE Likes (
        LikeId INT IDENTITY(1,1) PRIMARY KEY,
        PhotoId INT NOT NULL,
        UserId INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (PhotoId) REFERENCES Photos(PhotoId) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE NO ACTION,
        UNIQUE (PhotoId, UserId),
        INDEX IX_Likes_PhotoId (PhotoId),
        INDEX IX_Likes_UserId (UserId)
    )
END

-- Comments Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Comments')
BEGIN
    CREATE TABLE Comments (
        CommentId INT IDENTITY(1,1) PRIMARY KEY,
        PhotoId INT NOT NULL,
        UserId INT NOT NULL,
        CommentText NVARCHAR(500) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (PhotoId) REFERENCES Photos(PhotoId) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE NO ACTION,
        INDEX IX_Comments_PhotoId (PhotoId),
        INDEX IX_Comments_CreatedAt (CreatedAt DESC)
    )
END

-- Insert demo users
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, Role) 
    VALUES ('admin', 'admin@photoshare.local', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin')
END

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'john_creator')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, Role) 
    VALUES ('john_creator', 'john@photoshare.local', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'creator')
END

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'jane_user')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, Role) 
    VALUES ('jane_user', 'jane@photoshare.local', '$2b$10$WNH3WC4iN4t1n5jlDzF0y.mRdGz4QP2DZNuqR2aH3g8Fy/MzOGR8K', 'consumer')
END
```

7. Click **Run**

You should see "Commands completed successfully".

### Option B: Command Line

If you have `sqlcmd` installed:

```bash
sqlcmd -S scalable-sql.database.windows.net \
  -d scalable-db \
  -U scalableadmin \
  -P "scalable-admin-123!" \
  -i config/database-schema.sql
```

## 🚀 Part 4: Deploy via GitHub

### Step 4.1: Trigger Deployment

Now that everything is set up, deploy your code:

```bash
# Make sure all changes are committed
git status

# If there are changes, commit them
git add .
git commit -m "Final setup for Azure deployment"

# Push to GitHub - this triggers automatic deployment
git push origin main
```

### Step 4.2: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see "Deploy PhotoShare to Azure" workflow running
4. Click on it to view progress:
   - 🔵 **In progress**: Currently deploying
   - 🟢 **Completed**: Deployment successful
   - 🔴 **Failed**: Check error logs

The workflow completes in 5-10 minutes.

### Step 4.3: View Live Application

Once deployment completes successfully:

- **Frontend**: https://scalable-photo-app.azurewebsites.net
- **API Health Check**: https://scalable-photo-app.azurewebsites.net/health
- **API Base**: https://scalable-photo-app.azurewebsites.net/api

## ✅ Part 5: Test Application

### Test Login

1. Open https://scalable-photo-app.azurewebsites.net
2. Click "Create Account" or use demo account
3. **Demo Accounts**:
   - **Admin**: admin / Admin123!
   - **Creator**: john_creator / Creator123!
   - **Consumer**: jane_user / User123!

### Test Features

- [ ] Login with demo account
- [ ] View home page with sample photos (initially empty)
- [ ] For creators: Upload a test photo
- [ ] Like a photo
- [ ] Add a comment
- [ ] Edit/delete own content

## 🔄 Continuous Deployment Workflow

After initial setup, deployment is automatic:

### To Update Application:

```bash
# 1. Make code changes locally
# ... edit files ...

# 2. Commit changes
git add .
git commit -m "Describe your changes"

# 3. Push to GitHub
git push origin main

# 4. GitHub Actions automatically deploys!
```

**Just push to main, GitHub handles the rest!**

## 🛠️ Useful Commands

### View Deployment Status

```bash
# Check if app is running
curl https://scalable-photo-app.azurewebsites.net/health

# View app logs
az webapp log tail --resource-group scalable-group --name scalable-photo-app

# View app settings
az webapp config appsettings list --resource-group scalable-group --name scalable-photo-app

# Restart app
az webapp restart --resource-group scalable-group --name scalable-photo-app
```

### Rerun Deployment

If something fails, you can manually trigger deployment:

1. Go to **Actions** tab in GitHub
2. Click **Deploy PhotoShare to Azure** workflow
3. Click **Run workflow** → **Run workflow**

## ❌ Troubleshooting

### Deployment Fails in GitHub Actions

**Check the error:**
1. Go to **Actions** → Failed workflow
2. Expand the failed step
3. Read the error message

**Common issues:**

| Error | Solution |
|-------|----------|
| `Error: The workflow is not valid` | Check `.github/workflows/deploy.yml` syntax |
| `Resource not found` | Verify secret names are correct |
| `Unauthorized` | Check publish profile and storage key secrets |
| `npm ERR!` | Ensure all dependencies in `backend/package.json` |

### Application Won't Start

```bash
# Check logs
az webapp log tail --resource-group scalable-group --name scalable-photo-app

# Common issues:
# - Missing environment variables
# - Database not initialized
# - Storage key wrong
# - Connection string error
```

### Can't Connect to Database

```bash
# Verify database exists
az sql db show --resource-group scalable-group --server scalable-sql --name scalable-db

# Check if it's paused
az sql db show --resource-group scalable-group --server scalable-sql --name scalable-db --query "status"
```

### Upload Photos Fails

```bash
# Verify storage account
az storage account show --resource-group scalable-group --name scalablemediastorage

# Check container exists
az storage container exists --account-name scalablemediastorage --name photostorage
```

## 📈 Next Steps

After successful deployment:

1. **Add monitoring**: Enable Application Insights
2. **Custom domain**: Point your domain to App Service
3. **HTTPS**: Azure provides free SSL certificates
4. **Backups**: Configure database backups
5. **Cost monitoring**: Set budget alerts

## 📞 Support

If you encounter issues:

1. **Check GitHub Actions logs** for detailed error messages
2. **View App Service logs**: `az webapp log tail --resource-group scalable-group --name scalable-photo-app`
3. **Verify all secrets** are set correctly in GitHub
4. **Check Azure Portal** for service status

## Summary

You now have:

✅ GitHub repository with code
✅ GitHub Actions for automatic deployment
✅ Azure App Service running
✅ Azure SQL Database with schema
✅ Azure Storage for photos
✅ Automatic deployment on every push to main

**You're ready to deploy!** 🎉
